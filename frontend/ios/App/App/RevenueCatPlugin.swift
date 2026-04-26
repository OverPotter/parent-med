import Foundation
import Capacitor
import RevenueCat

@objc(RevenueCatPlugin)
public final class RevenueCatPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RevenueCatPlugin"
    public let jsName = "RevenueCat"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setLogLevel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logOut", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCustomerSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getOfferings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchasePackage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
    ]

    private var entitlementCode: String?

    @objc func setLogLevel(_ call: CAPPluginCall) {
        guard let level = call.getString("level") else {
            call.reject("level is required")
            return
        }

        switch level.lowercased() {
        case "debug":
            Purchases.logLevel = .debug
        case "info":
            Purchases.logLevel = .info
        case "warn":
            Purchases.logLevel = .warn
        case "error":
            Purchases.logLevel = .error
        default:
            call.reject("Unsupported RevenueCat log level")
            return
        }

        call.resolve()
    }

    @objc func configure(_ call: CAPPluginCall) {
        guard let apiKey = call.getString("apiKey"), !apiKey.isEmpty else {
            call.reject("apiKey is required")
            return
        }

        let appUserId = call.getString("appUserId")
        self.entitlementCode = call.getString("entitlementCode")

        if Purchases.isConfigured {
            call.resolve()
            return
        }

        if let appUserId, !appUserId.isEmpty {
            Purchases.configure(withAPIKey: apiKey, appUserID: appUserId)
        } else {
            Purchases.configure(withAPIKey: apiKey)
        }

        call.resolve()
    }

    @objc func logIn(_ call: CAPPluginCall) {
        guard let appUserId = call.getString("appUserId"), !appUserId.isEmpty else {
            call.reject("appUserId is required")
            return
        }

        Task {
            do {
                let (customerInfo, _) = try await Purchases.shared.logIn(appUserId)
                call.resolve(["customerSnapshot": snapshotDictionary(from: customerInfo)])
            } catch {
                call.reject("RevenueCat logIn failed", nil, error)
            }
        }
    }

    @objc func logOut(_ call: CAPPluginCall) {
        Task {
            do {
                let customerInfo = try await Purchases.shared.logOut()
                call.resolve(["customerSnapshot": snapshotDictionary(from: customerInfo)])
            } catch {
                call.reject("RevenueCat logOut failed", nil, error)
            }
        }
    }

    @objc func getCustomerSnapshot(_ call: CAPPluginCall) {
        if let requestedEntitlement = call.getString("entitlementCode") {
            self.entitlementCode = requestedEntitlement
        }

        Task {
            do {
                let customerInfo = try await Purchases.shared.customerInfo()
                call.resolve(["customerSnapshot": snapshotDictionary(from: customerInfo)])
            } catch {
                call.reject("RevenueCat customer info fetch failed", nil, error)
            }
        }
    }

    @objc func getOfferings(_ call: CAPPluginCall) {
        Task {
            do {
                let offerings = try await Purchases.shared.offerings()
                let currentOffering = offerings.current
                    ?? offerings.all.values.first(where: { !$0.availablePackages.isEmpty })
                let packageDictionary: (Package) -> [String: Any] = { package in
                    [
                        "identifier": package.identifier,
                        "packageType": String(describing: package.packageType).lowercased(),
                        "productIdentifier": package.storeProduct.productIdentifier,
                        "title": package.storeProduct.localizedTitle,
                        "priceString": package.storeProduct.localizedPriceString,
                    ]
                }
                let packages = (currentOffering?.availablePackages ?? []).map(packageDictionary)
                let allOfferings = offerings.all.values.map { offering in
                    [
                        "identifier": offering.identifier,
                        "serverDescription": offering.serverDescription,
                        "availablePackages": offering.availablePackages.map(packageDictionary),
                    ]
                }
                call.resolve([
                    "currentOfferingIdentifier": jsonValue(currentOffering?.identifier),
                    "availablePackages": packages,
                    "allOfferings": allOfferings,
                ])
            } catch {
                call.reject("RevenueCat offerings fetch failed", nil, error)
            }
        }
    }

    @objc func purchasePackage(_ call: CAPPluginCall) {
        let packageIdentifier = call.getString("packageIdentifier")
        let offeringIdentifier = call.getString("offeringIdentifier")
        if let requestedEntitlement = call.getString("entitlementCode") {
            self.entitlementCode = requestedEntitlement
        }

        guard let packageIdentifier, !packageIdentifier.isEmpty else {
            call.reject("packageIdentifier is required")
            return
        }

        Task {
            do {
                let offerings = try await Purchases.shared.offerings()
                let offering = offeringIdentifier.flatMap { offerings.offering(identifier: $0) }
                    ?? offerings.current
                    ?? offerings.all.values.first(where: { !$0.availablePackages.isEmpty })
                let package = offering?.availablePackages.first(where: { $0.identifier == packageIdentifier })
                    ?? offerings.all.values
                        .flatMap(\.availablePackages)
                        .first(where: { $0.identifier == packageIdentifier })
                guard let package else {
                    call.reject("RevenueCat package not found")
                    return
                }
                let result = try await Purchases.shared.purchase(package: package)
                call.resolve(["customerSnapshot": snapshotDictionary(from: result.customerInfo)])
            } catch {
                call.reject("RevenueCat purchase failed", nil, error)
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        if let requestedEntitlement = call.getString("entitlementCode") {
            self.entitlementCode = requestedEntitlement
        }

        Task {
            do {
                let customerInfo = try await Purchases.shared.restorePurchases()
                call.resolve(["customerSnapshot": snapshotDictionary(from: customerInfo)])
            } catch {
                call.reject("RevenueCat restore failed", nil, error)
            }
        }
    }

    private func snapshotDictionary(from customerInfo: CustomerInfo) -> [String: Any] {
        let selectedEntitlement = resolveEntitlement(from: customerInfo)
        let status = resolveStatus(for: selectedEntitlement)

        return [
            "configured": Purchases.isConfigured,
            "appUserId": Purchases.shared.appUserID,
            "originalAppUserId": jsonValue(customerInfo.originalAppUserId),
            "entitlementCode": jsonValue(selectedEntitlement?.identifier),
            "entitlementActive": selectedEntitlement?.isActive ?? false,
            "status": status,
            "productId": jsonValue(selectedEntitlement?.productIdentifier),
            "latestPurchaseDate": jsonValue(selectedEntitlement?.latestPurchaseDate?.iso8601String),
            "originalPurchaseDate": jsonValue(selectedEntitlement?.originalPurchaseDate?.iso8601String),
            "expirationDate": jsonValue(selectedEntitlement?.expirationDate?.iso8601String),
            "willRenew": selectedEntitlement?.willRenew ?? false,
            "isSandbox": selectedEntitlement?.isSandbox ?? false,
            "ownershipType": jsonValue(selectedEntitlement.map { String(describing: $0.ownershipType).lowercased() }),
            "providerCustomerId": NSNull(),
            "providerSubscriptionId": NSNull(),
            "rawPayload": [
                "activeEntitlements": Array(customerInfo.entitlements.active.keys),
                "allPurchasedProductIdentifiers": Array(customerInfo.allPurchasedProductIdentifiers),
                "latestExpirationDate": jsonValue(customerInfo.latestExpirationDate?.iso8601String),
                "firstSeen": customerInfo.firstSeen.iso8601String,
                "requestDate": customerInfo.requestDate.iso8601String,
            ],
        ]
    }

    private func jsonValue(_ value: String?) -> Any {
        value ?? NSNull()
    }

    private func resolveEntitlement(from customerInfo: CustomerInfo) -> EntitlementInfo? {
        if let entitlementCode = self.entitlementCode {
            if let activeEntitlement = customerInfo.entitlements.active[entitlementCode] {
                return activeEntitlement
            }
            return customerInfo.entitlements.all[entitlementCode]
        }

        return customerInfo.entitlements.active.first?.value
            ?? customerInfo.entitlements.all.first?.value
    }

    private func resolveStatus(for entitlement: EntitlementInfo?) -> String {
        guard let entitlement else {
            return "inactive"
        }

        if entitlement.isActive {
            if entitlement.billingIssueDetectedAt != nil {
                return "grace"
            }

            switch entitlement.periodType {
            case .trial:
                return "trialing"
            default:
                return "active"
            }
        }

        if entitlement.billingIssueDetectedAt != nil {
            return "grace"
        }
        if entitlement.unsubscribeDetectedAt != nil {
            return "canceled"
        }
        if entitlement.expirationDate != nil {
            return "expired"
        }

        return "inactive"
    }
}

private extension Date {
    var iso8601String: String {
        ISO8601DateFormatter().string(from: self)
    }
}
