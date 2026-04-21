import Foundation

#if canImport(ActivityKit)
import ActivityKit
#endif

actor LiveActivitiesManager {
    private var inFlightUpsertKeys = Set<String>()

    private let iso8601Formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    func getStatus() -> [String: Any] {
        guard #available(iOS 16.1, *), canImportActivityKit else {
            return [
                "supported": false,
                "available": false,
                "authorizationState": "unsupported",
            ]
        }

#if canImport(ActivityKit)
        let info = ActivityAuthorizationInfo()

        return [
            "supported": true,
            "available": info.areActivitiesEnabled,
            "authorizationState": info.areActivitiesEnabled ? "enabled" : "disabled",
        ]
#else
        return [
            "supported": false,
            "available": false,
            "authorizationState": "unsupported",
        ]
#endif
    }

    func parsePayload(_ data: [String: Any]) -> LiveActivityPayload? {
        guard
            let kind = data["kind"] as? String,
            let itemId = data["itemId"] as? String,
            let title = data["title"] as? String,
            let startedAtRaw = data["startedAt"] as? String
        else {
            return nil
        }

        let startedAt =
            iso8601Formatter.date(from: startedAtRaw) ??
            ISO8601DateFormatter().date(from: startedAtRaw)

        guard let startedAt else {
            return nil
        }

        return LiveActivityPayload(
            kind: kind,
            itemId: itemId,
            title: title,
            subtitle: data["subtitle"] as? String,
            startedAt: startedAt,
            deepLink: data["deepLink"] as? String
        )
    }

    func upsert(payload: LiveActivityPayload) async throws -> String? {
#if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            return nil
        }

        let key = activityKey(kind: payload.kind, itemId: payload.itemId)
        if inFlightUpsertKeys.contains(key) {
            return findActivity(kind: payload.kind, itemId: payload.itemId)?.id
        }
        inFlightUpsertKeys.insert(key)
        defer { inFlightUpsertKeys.remove(key) }

        let attributes = LiveActivityAttributes(kind: payload.kind, itemId: payload.itemId)
        let contentState = LiveActivityAttributes.ContentState(
            title: payload.title,
            subtitle: payload.subtitle,
            startedAt: payload.startedAt,
            deepLink: payload.deepLink
        )

        let matched = matchingActivities(kind: payload.kind, itemId: payload.itemId)
        if matched.count > 1 {
            for activity in matched.dropFirst() {
                await activity.end(using: activity.contentState, dismissalPolicy: .immediate)
            }
        }

        if let existing = matched.first {
            await existing.update(using: contentState)
            return existing.id
        }

        let activity = try Activity<LiveActivityAttributes>.request(
            attributes: attributes,
            contentState: contentState,
            pushType: nil
        )
        return activity.id
#else
        return nil
#endif
    }

    func stop(kind: String, itemId: String) async {
#if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            return
        }

        inFlightUpsertKeys.remove(activityKey(kind: kind, itemId: itemId))
        let matched = matchingActivities(kind: kind, itemId: itemId)
        for activity in matched {
            await activity.end(using: activity.contentState, dismissalPolicy: .immediate)
        }
#endif
    }

    func stopAll(kind: String?) async {
#if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            return
        }

        let matched = Activity<LiveActivityAttributes>.activities.filter {
            guard let kind else {
                return true
            }
            return $0.attributes.kind == kind
        }
        if let kind {
            inFlightUpsertKeys = inFlightUpsertKeys.filter { !$0.hasPrefix("\(kind)::") }
        } else {
            inFlightUpsertKeys.removeAll()
        }
        for activity in matched {
            await activity.end(using: activity.contentState, dismissalPolicy: .immediate)
        }
#endif
    }

#if canImport(ActivityKit)
    @available(iOS 16.1, *)
    private func findActivity(kind: String, itemId: String) -> Activity<LiveActivityAttributes>? {
        matchingActivities(kind: kind, itemId: itemId).first
    }

    @available(iOS 16.1, *)
    private func matchingActivities(kind: String, itemId: String) -> [Activity<LiveActivityAttributes>] {
        Activity<LiveActivityAttributes>.activities.filter {
            $0.attributes.kind == kind && $0.attributes.itemId == itemId
        }
    }
#endif

    private func activityKey(kind: String, itemId: String) -> String {
        "\(kind)::\(itemId)"
    }
}

private var canImportActivityKit: Bool {
#if canImport(ActivityKit)
    return true
#else
    return false
#endif
}
