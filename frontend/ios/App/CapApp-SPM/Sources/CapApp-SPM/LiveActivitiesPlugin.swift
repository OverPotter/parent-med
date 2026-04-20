import Foundation
import Capacitor

@objc(LiveActivitiesPlugin)
public final class LiveActivitiesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivitiesPlugin"
    public let jsName = "LiveActivities"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "upsert", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopAll", returnType: CAPPluginReturnPromise),
    ]

    private let manager = LiveActivitiesManager()

    @objc func getStatus(_ call: CAPPluginCall) {
        Task {
            let status = await manager.getStatus()
            NSLog("[PM] LiveActivities getStatus %@", status as NSDictionary)
            call.resolve(status)
        }
    }

    @objc func upsert(_ call: CAPPluginCall) {
        let options: [String: Any] = Dictionary(uniqueKeysWithValues: call.options.compactMap { entry in
            guard let key = entry.key as? String else {
                return nil
            }
            return (key, entry.value)
        })

        Task {
            guard let payload = await manager.parsePayload(options) else {
                NSLog("[PM] LiveActivities invalid payload %@", options as NSDictionary)
                call.reject("Invalid live activity payload")
                return
            }
            do {
                NSLog("[PM] LiveActivities upsert %@", [
                    "kind": payload.kind,
                    "itemId": payload.itemId,
                    "title": payload.title,
                    "subtitle": payload.subtitle ?? "",
                    "startedAt": payload.startedAt.ISO8601Format(),
                    "deepLink": payload.deepLink ?? "",
                ] as NSDictionary)
                let activeId = try await manager.upsert(payload: payload)
                NSLog("[PM] LiveActivities upsert success %@", activeId ?? "nil")
                call.resolve(["activeId": activeId as Any])
            } catch {
                NSLog("[PM] LiveActivities upsert error %@", String(describing: error))
                call.reject("Failed to upsert live activity", nil, error)
            }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        guard
            let kind = call.getString("kind"),
            let itemId = call.getString("itemId")
        else {
            call.reject("kind and itemId are required")
            return
        }

        Task {
            NSLog("[PM] LiveActivities stop kind=%@ itemId=%@", kind, itemId)
            await manager.stop(kind: kind, itemId: itemId)
            call.resolve()
        }
    }

    @objc func stopAll(_ call: CAPPluginCall) {
        let kind = call.getString("kind")

        Task {
            NSLog("[PM] LiveActivities stopAll kind=%@", kind ?? "all")
            await manager.stopAll(kind: kind)
            call.resolve()
        }
    }
}
