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
                call.reject("Invalid live activity payload")
                return
            }
            do {
                let activeId = try await manager.upsert(payload: payload)
                call.resolve(["activeId": activeId as Any])
            } catch {
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
            await manager.stop(kind: kind, itemId: itemId)
            call.resolve()
        }
    }

    @objc func stopAll(_ call: CAPPluginCall) {
        let kind = call.getString("kind")

        Task {
            await manager.stopAll(kind: kind)
            call.resolve()
        }
    }
}
