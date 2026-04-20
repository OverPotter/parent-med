import ActivityKit
import WidgetKit
import SwiftUI
import CapApp_SPM

@available(iOSApplicationExtension 16.1, *)
struct SleepFeedingLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LiveActivityAttributes.self) { context in
            LiveActivityLockScreenView(context: context)
                .activityBackgroundTint(.clear)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 9) {
                        ActivityIcon(kind: context.attributes.kind, size: 36)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(context.state.title)
                                .font(.system(size: 15, weight: .semibold, design: .rounded))
                                .foregroundStyle(.white)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                            Text(activityTitle(for: context))
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.62))
                                .lineLimit(1)
                        }
                        .layoutPriority(1)
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    ElapsedTimerText(
                        startedAt: context.state.startedAt,
                        font: .system(size: 23, weight: .bold, design: .rounded)
                    )
                    .foregroundStyle(.white)
                    .frame(minWidth: 62, alignment: .trailing)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    OpenActivityLink(url: deepLinkURL(for: context), compact: true)
                }
            } compactLeading: {
                ZStack {
                    Circle()
                        .fill(activityAccentColor(for: context.attributes.kind).opacity(0.18))
                    Image(systemName: iconName(for: context.attributes.kind))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(activityAccentColor(for: context.attributes.kind))
                }
            } compactTrailing: {
                ElapsedTimerText(startedAt: context.state.startedAt, font: .caption.weight(.semibold))
                    .foregroundStyle(.white)
            } minimal: {
                ZStack {
                    Circle()
                        .fill(activityAccentColor(for: context.attributes.kind).opacity(0.18))
                    Image(systemName: iconName(for: context.attributes.kind))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(activityAccentColor(for: context.attributes.kind))
                }
            }
        }
    }
}

@available(iOSApplicationExtension 16.1, *)
private struct LiveActivityLockScreenView: View {
    let context: ActivityViewContext<LiveActivityAttributes>

    var body: some View {
        let kind = context.attributes.kind
        let deepLink = deepLinkURL(for: context)

        ZStack {
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(backgroundGradient(for: kind))
                .overlay(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .strokeBorder(.white.opacity(0.09), lineWidth: 1)
                )

            VStack(alignment: .leading, spacing: 15) {
                HStack(alignment: .center, spacing: 13) {
                    ActivityIcon(kind: kind, size: 46)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.state.title)
                            .font(.system(size: 19, weight: .semibold, design: .rounded))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                            .minimumScaleFactor(0.82)

                        Text(activityTitle(for: context))
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(activityAccentColor(for: kind))
                            .lineLimit(1)
                            .minimumScaleFactor(0.9)
                    }

                    Spacer(minLength: 10)

                    ElapsedTimerText(
                        startedAt: context.state.startedAt,
                        font: .system(size: 27, weight: .bold, design: .rounded)
                    )
                    .foregroundStyle(.white)
                    .frame(minWidth: 82, alignment: .trailing)
                }

                OpenActivityLink(url: deepLink, compact: false)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 17)
        }
        .widgetURL(deepLink)
    }
}

@available(iOSApplicationExtension 16.1, *)
private struct ElapsedTimerText: View {
    let startedAt: Date
    let font: Font

    var body: some View {
        Text(startedAt, style: .timer)
            .font(font)
            .monospacedDigit()
            .multilineTextAlignment(.trailing)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
    }
}

@available(iOSApplicationExtension 16.1, *)
private struct ActivityIcon: View {
    let kind: String
    let size: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.3, style: .continuous)
                .fill(activityAccentColor(for: kind).opacity(0.16))
                .overlay(
                    RoundedRectangle(cornerRadius: size * 0.3, style: .continuous)
                        .strokeBorder(activityAccentColor(for: kind).opacity(0.14), lineWidth: 1)
                )
            Image(systemName: iconName(for: kind))
                .font(.system(size: size * 0.42, weight: .semibold))
                .foregroundStyle(activityAccentColor(for: kind))
        }
        .frame(width: size, height: size)
    }
}

@available(iOSApplicationExtension 16.1, *)
private struct OpenActivityLink: View {
    let url: URL?
    let compact: Bool

    var body: some View {
        Group {
            if let url {
                Link(destination: url) {
                    HStack(spacing: compact ? 6 : 8) {
                        Image(systemName: "arrow.up.right")
                        Text("Открыть")
                    }
                    .font(compact ? .caption.weight(.semibold) : .subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, compact ? 7 : 10)
                    .padding(.horizontal, compact ? 10 : 14)
                    .background(
                        Capsule()
                            .fill(Color.white.opacity(compact ? 0.11 : 0.13))
                            .overlay(Capsule().strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

@available(iOSApplicationExtension 16.1, *)
private func deepLinkURL(for context: ActivityViewContext<LiveActivityAttributes>) -> URL? {
    guard let raw = context.state.deepLink, !raw.isEmpty else {
        return nil
    }

    if raw.hasPrefix("/") {
        return URL(string: "capacitor://localhost\(raw)")
    }

    return URL(string: raw)
}

@available(iOSApplicationExtension 16.1, *)
private func activityTitle(for context: ActivityViewContext<LiveActivityAttributes>) -> String {
    if let subtitle = context.state.subtitle, !subtitle.isEmpty {
        return subtitle
    }

    return context.attributes.kind == "sleep" ? "Сон" : "Кормление"
}

@available(iOSApplicationExtension 16.1, *)
private func iconName(for kind: String) -> String {
    kind == "sleep" ? "moon.stars.fill" : "drop.fill"
}

@available(iOSApplicationExtension 16.1, *)
private func activityAccentColor(for kind: String) -> Color {
    kind == "sleep"
        ? Color(red: 0.38, green: 0.88, blue: 0.98)
        : Color(red: 0.70, green: 0.58, blue: 0.98)
}

@available(iOSApplicationExtension 16.1, *)
private func backgroundGradient(for kind: String) -> LinearGradient {
    if kind == "sleep" {
        return LinearGradient(
            colors: [
                Color(red: 0.07, green: 0.11, blue: 0.19),
                Color(red: 0.04, green: 0.14, blue: 0.22),
                Color(red: 0.02, green: 0.08, blue: 0.14)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    return LinearGradient(
        colors: [
            Color(red: 0.13, green: 0.09, blue: 0.20),
            Color(red: 0.18, green: 0.11, blue: 0.30),
            Color(red: 0.09, green: 0.06, blue: 0.16)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
