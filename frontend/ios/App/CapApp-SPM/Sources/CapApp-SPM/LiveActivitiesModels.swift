import Foundation

#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
public struct LiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public let title: String
        public let subtitle: String?
        public let statusLabel: String?
        public let primaryValue: String?
        public let primaryCaption: String?
        public let secondaryValue: String?
        public let secondaryCaption: String?
        public let startedAt: Date
        public let deepLink: String?

        public init(
            title: String,
            subtitle: String?,
            statusLabel: String?,
            primaryValue: String?,
            primaryCaption: String?,
            secondaryValue: String?,
            secondaryCaption: String?,
            startedAt: Date,
            deepLink: String?
        ) {
            self.title = title
            self.subtitle = subtitle
            self.statusLabel = statusLabel
            self.primaryValue = primaryValue
            self.primaryCaption = primaryCaption
            self.secondaryValue = secondaryValue
            self.secondaryCaption = secondaryCaption
            self.startedAt = startedAt
            self.deepLink = deepLink
        }
    }

    public let kind: String
    public let itemId: String

    public init(kind: String, itemId: String) {
        self.kind = kind
        self.itemId = itemId
    }
}
#endif

struct LiveActivityPayload {
    let kind: String
    let itemId: String
    let title: String
    let subtitle: String?
    let statusLabel: String?
    let primaryValue: String?
    let primaryCaption: String?
    let secondaryValue: String?
    let secondaryCaption: String?
    let startedAt: Date
    let deepLink: String?
}
