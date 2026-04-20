import Foundation

#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
public struct LiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public let title: String
        public let subtitle: String?
        public let startedAt: Date
        public let deepLink: String?

        public init(title: String, subtitle: String?, startedAt: Date, deepLink: String?) {
            self.title = title
            self.subtitle = subtitle
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
    let startedAt: Date
    let deepLink: String?
}
