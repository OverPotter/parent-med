import ExpoModulesCore

public final class ParentMedLiveActivitiesModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ParentMedLiveActivities")

        AsyncFunction("getStatus") {
            await LiveActivitiesManager.shared.getStatus()
        }

        AsyncFunction("upsert") { (payload: [String: Any]) -> [String: Any] in
            guard let parsed = await LiveActivitiesManager.shared.parsePayload(payload) else {
                throw InvalidLiveActivityPayloadException()
            }

            let activeId = try await LiveActivitiesManager.shared.upsert(payload: parsed)
            return ["activeId": activeId as Any]
        }

        AsyncFunction("stop") { (kind: String, itemId: String) in
            await LiveActivitiesManager.shared.stop(kind: kind, itemId: itemId)
        }

        AsyncFunction("stopAll") { (kind: String?) in
            await LiveActivitiesManager.shared.stopAll(kind: kind)
        }
    }
}

internal final class InvalidLiveActivityPayloadException: Exception {
    override var reason: String {
        "Invalid live activity payload"
    }
}
