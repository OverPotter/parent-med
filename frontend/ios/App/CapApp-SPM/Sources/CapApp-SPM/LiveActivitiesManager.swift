import Foundation
import SwiftKeychainWrapper

#if canImport(ActivityKit)
import ActivityKit
#endif

public actor LiveActivitiesManager {
    public static let shared = LiveActivitiesManager()

    private static let accessTokenKey = "pillpath_auth_access_token"
    private static let refreshTokenKey = "pillpath_auth_refresh_token"

    private var inFlightUpsertKeys = Set<String>()
    private let persistenceKey = "pillpath.liveActivities.persistedPayloads.v1"
    private let keychain = KeychainWrapper(serviceName: "cap_sec")

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
            language: data["language"] as? String,
            title: title,
            subtitle: data["subtitle"] as? String,
            statusLabel: data["statusLabel"] as? String,
            primaryValue: data["primaryValue"] as? String,
            primaryCaption: data["primaryCaption"] as? String,
            secondaryValue: data["secondaryValue"] as? String,
            secondaryCaption: data["secondaryCaption"] as? String,
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
            language: payload.language,
            title: payload.title,
            subtitle: payload.subtitle,
            statusLabel: payload.statusLabel,
            primaryValue: payload.primaryValue,
            primaryCaption: payload.primaryCaption,
            secondaryValue: payload.secondaryValue,
            secondaryCaption: payload.secondaryCaption,
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
            persistPayload(payload)
            return existing.id
        }

        let activity = try Activity<LiveActivityAttributes>.request(
            attributes: attributes,
            contentState: contentState,
            pushType: nil
        )
        persistPayload(payload)
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
        removePersistedPayload(kind: kind, itemId: itemId)
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
            removePersistedPayloads(kind: kind)
        } else {
            inFlightUpsertKeys.removeAll()
            clearPersistedPayloads()
        }
        for activity in matched {
            await activity.end(using: activity.contentState, dismissalPolicy: .immediate)
        }
#endif
    }

    public func restorePersistedActivities() async {
#if canImport(ActivityKit)
        guard #available(iOS 16.1, *), canImportActivityKit else {
            return
        }

        let info = ActivityAuthorizationInfo()
        guard info.areActivitiesEnabled else {
            return
        }
        guard hasValidPersistedAuthSession() else {
            clearPersistedPayloads()
            return
        }

        let payloads = loadPersistedPayloads()
        guard !payloads.isEmpty else {
            return
        }

        for payload in payloads {
            do {
                _ = try await upsert(payload: payload)
            } catch {
                continue
            }
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

    private func loadPersistedPayloadMap() -> [String: LiveActivityPayload] {
        guard
            let data = UserDefaults.standard.data(forKey: persistenceKey),
            let payloads = try? JSONDecoder().decode([String: LiveActivityPayload].self, from: data)
        else {
            return [:]
        }
        return payloads
    }

    private func savePersistedPayloadMap(_ payloads: [String: LiveActivityPayload]) {
        guard let data = try? JSONEncoder().encode(payloads) else {
            return
        }
        UserDefaults.standard.set(data, forKey: persistenceKey)
    }

    private func loadPersistedPayloads() -> [LiveActivityPayload] {
        Array(loadPersistedPayloadMap().values)
    }

    private func persistPayload(_ payload: LiveActivityPayload) {
        var payloads = loadPersistedPayloadMap()
        payloads[activityKey(kind: payload.kind, itemId: payload.itemId)] = payload
        savePersistedPayloadMap(payloads)
    }

    private func removePersistedPayload(kind: String, itemId: String) {
        var payloads = loadPersistedPayloadMap()
        payloads.removeValue(forKey: activityKey(kind: kind, itemId: itemId))
        savePersistedPayloadMap(payloads)
    }

    private func removePersistedPayloads(kind: String) {
        let prefix = "\(kind)::"
        let nextPayloads = loadPersistedPayloadMap().filter { !$0.key.hasPrefix(prefix) }
        savePersistedPayloadMap(nextPayloads)
    }

    private func clearPersistedPayloads() {
        UserDefaults.standard.removeObject(forKey: persistenceKey)
    }

    private func hasValidPersistedAuthSession() -> Bool {
        if let accessToken = keychain.string(forKey: Self.accessTokenKey), isJwtStillActive(accessToken) {
            return true
        }
        if let refreshToken = keychain.string(forKey: Self.refreshTokenKey), isJwtStillActive(refreshToken) {
            return true
        }
        return false
    }

    private func isJwtStillActive(_ token: String) -> Bool {
        guard
            let payloadSegment = token.split(separator: ".").dropFirst().first,
            let payloadData = decodeBase64URL(String(payloadSegment)),
            let payloadJson = try? JSONSerialization.jsonObject(with: payloadData) as? [String: Any]
        else {
            return false
        }

        let now = Date().timeIntervalSince1970

        if let exp = payloadJson["exp"] as? TimeInterval {
            return exp > now
        }
        if let exp = payloadJson["exp"] as? Double {
            return exp > now
        }
        if let exp = payloadJson["exp"] as? Int {
            return Double(exp) > now
        }
        return false
    }

    private func decodeBase64URL(_ value: String) -> Data? {
        var normalized = value
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        let remainder = normalized.count % 4
        if remainder != 0 {
            normalized += String(repeating: "=", count: 4 - remainder)
        }

        return Data(base64Encoded: normalized)
    }
}

private var canImportActivityKit: Bool {
#if canImport(ActivityKit)
    return true
#else
    return false
#endif
}
