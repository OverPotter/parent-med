import ActivityKit
import WidgetKit
import SwiftUI
import CapApp_SPM

func liveActivityUsesRussian(_ languageCode: String? = nil) -> Bool {
    if let normalized = languageCode?.lowercased(), normalized.hasPrefix("ru") || normalized.hasPrefix("en") {
        return normalized.hasPrefix("ru")
    }
    return Locale.preferredLanguages.first?.lowercased().hasPrefix("ru") == true
}

func liveActivityText(_ ru: String, _ en: String, _ languageCode: String? = nil) -> String {
    liveActivityUsesRussian(languageCode) ? ru : en
}

func liveActivityLocale(_ languageCode: String? = nil) -> Locale {
    liveActivityUsesRussian(languageCode) ? Locale(identifier: "ru_RU") : Locale(identifier: "en_US")
}

@available(iOSApplicationExtension 16.1, *)
struct SleepFeedingLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LiveActivityAttributes.self) { context in
            LiveActivityLockScreenView(context: context)
                .activityBackgroundTint(.black.opacity(0.16))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 7) {
                        ActivityIcon(kind: context.attributes.kind, size: 28)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(context.state.title)
                                .font(.system(size: 11, weight: .semibold, design: .rounded))
                                .foregroundStyle(.white)
                                .lineLimit(1)
                                .minimumScaleFactor(0.52)
                            CompactActivityEyebrowText(context: context)
                                .font(.system(size: 8, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.62))
                        }
                        .frame(maxWidth: 88, alignment: .leading)
                        .layoutPriority(1)
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    if context.attributes.kind == "illness" {
                        IllnessDayText(
                            startedAt: context.state.startedAt,
                            font: .system(size: 20, weight: .bold, design: .rounded),
                            languageCode: context.state.language
                        )
                        .foregroundStyle(.white)
                        .frame(minWidth: 62, alignment: .trailing)
                    } else {
                        ElapsedTimerText(
                            startedAt: context.state.startedAt,
                            font: .system(size: 20, weight: .bold, design: .rounded),
                            languageCode: context.state.language
                        )
                        .foregroundStyle(.white)
                        .frame(minWidth: 62, alignment: .trailing)
                    }
                }

                DynamicIslandExpandedRegion(.bottom) {
                    OpenActivityLink(
                        url: deepLinkURL(for: context),
                        compact: true,
                        languageCode: context.state.language
                    )
                }
            } compactLeading: {
                ZStack {
                    Circle()
                        .fill(activityAccentColor(for: context.attributes.kind).opacity(0.18))
                    CompactActivityGlyph(kind: context.attributes.kind, size: 12)
                }
            } compactTrailing: {
                if context.attributes.kind == "illness" {
                    Text(compactIllnessDayLabel(startedAt: context.state.startedAt, languageCode: context.state.language))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white)
                } else {
                    CompactElapsedText(
                        startedAt: context.state.startedAt,
                        languageCode: context.state.language,
                        font: .caption.weight(.semibold),
                        minimumScaleFactor: 0.85
                    )
                        .foregroundStyle(.white)
                }
            } minimal: {
                ZStack {
                    Circle()
                        .fill(activityAccentColor(for: context.attributes.kind).opacity(0.18))
                    CompactActivityGlyph(kind: context.attributes.kind, size: 12)
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

        Group {
            if kind == "sleep" {
                SleepReferenceLockScreenView(context: context, deepLink: deepLink)
                    .widgetURL(deepLink)
            } else if kind == "feeding" {
                FeedingReferenceLockScreenView(context: context, deepLink: deepLink)
                    .widgetURL(deepLink)
            } else if kind == "illness" {
                IllnessReferenceLockScreenView(context: context, deepLink: deepLink)
                    .widgetURL(deepLink)
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .fill(backgroundGradient(for: kind))
                        .overlay(
                            RoundedRectangle(cornerRadius: 26, style: .continuous)
                                .strokeBorder(.black.opacity(0.38), lineWidth: 3.1)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 26, style: .continuous)
                                .inset(by: 0.9)
                                .strokeBorder(.white.opacity(0.16), lineWidth: 1.1)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 26, style: .continuous)
                                .inset(by: 2.1)
                                .strokeBorder(.white.opacity(0.07), lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.34), radius: 24, x: 0, y: 14)

                    VStack(alignment: .leading, spacing: 15) {
                        HStack(alignment: .center, spacing: 13) {
                            ActivityIcon(kind: kind, size: 46)

                            VStack(alignment: .leading, spacing: 4) {
                                Text(context.state.title)
                                    .font(.system(size: 19, weight: .semibold, design: .rounded))
                                    .foregroundStyle(.white)
                                    .lineLimit(2)
                                    .minimumScaleFactor(0.82)

                                Text(activitySubtitle(for: context))
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(activityAccentColor(for: kind))
                                    .lineLimit(2)
                                    .minimumScaleFactor(0.9)
                            }

                            Spacer(minLength: 10)

                            if kind == "illness" {
                                IllnessDayText(
                                    startedAt: context.state.startedAt,
                                    font: .system(size: 24, weight: .bold, design: .rounded),
                                    languageCode: context.state.language
                                )
                                .foregroundStyle(.white)
                                .frame(minWidth: 82, alignment: .trailing)
                            } else {
                                ElapsedTimerText(
                                    startedAt: context.state.startedAt,
                                    font: .system(size: 24, weight: .bold, design: .rounded),
                                    languageCode: context.state.language
                                )
                                .foregroundStyle(.white)
                                .frame(minWidth: 82, alignment: .trailing)
                            }
                        }

                        if hasSupplementaryDetails(context: context) {
                            VStack(alignment: .leading, spacing: 7) {
                                if let primaryRow = detailRow(
                                    value: context.state.primaryValue,
                                    caption: context.state.primaryCaption
                                ) {
                                    primaryRow
                                }
                                if let secondaryRow = detailRow(
                                    value: context.state.secondaryValue,
                                    caption: context.state.secondaryCaption
                                ) {
                                    secondaryRow
                                }
                            }
                        }

                        OpenActivityLink(
                            url: deepLink,
                            compact: false,
                            languageCode: context.state.language
                        )
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 17)
                }
                .widgetURL(deepLink)
            }
        }
    }
}

private func hasSupplementaryDetails(context: ActivityViewContext<LiveActivityAttributes>) -> Bool {
    if context.attributes.kind != "illness" {
        return false
    }
    let primaryValue = context.state.primaryValue?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let secondaryValue = context.state.secondaryValue?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    return !primaryValue.isEmpty || !secondaryValue.isEmpty
}

@available(iOSApplicationExtension 16.1, *)
private func detailRow(value: String?, caption: String?) -> AnyView? {
    let trimmedValue = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if trimmedValue.isEmpty {
        return nil
    }

    let trimmedCaption = caption?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    return AnyView(
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            if !trimmedCaption.isEmpty {
                Text(trimmedCaption)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.62))
                    .lineLimit(1)
            }
            Text(trimmedValue)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(.white.opacity(0.96))
                .lineLimit(1)
                .minimumScaleFactor(0.86)
            Spacer(minLength: 0)
        }
    )
}

@available(iOSApplicationExtension 16.1, *)
private struct ElapsedTimerText: View {
    let startedAt: Date
    let font: Font
    let languageCode: String?

    var body: some View {
        Text(startedAt, style: .timer)
        .environment(\.locale, liveActivityLocale(languageCode))
        .font(font)
        .monospacedDigit()
        .multilineTextAlignment(.trailing)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
}

@available(iOSApplicationExtension 16.1, *)
struct LeadingElapsedTimerText: View {
    let startedAt: Date
    let font: Font
    let languageCode: String?

    var body: some View {
        Text(startedAt, style: .timer)
        .environment(\.locale, liveActivityLocale(languageCode))
        .font(font)
        .monospacedDigit()
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity, alignment: .leading)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
}

@available(iOSApplicationExtension 16.1, *)
private struct CompactElapsedText: View {
    let startedAt: Date
    let languageCode: String?
    let font: Font
    let minimumScaleFactor: CGFloat

    var body: some View {
        TimelineView(.periodic(from: startedAt, by: 60)) { timeline in
            Text(abbreviatedElapsedLabel(
                startedAt: startedAt,
                now: timeline.date,
                languageCode: languageCode
            ))
            .font(font)
            .monospacedDigit()
            .lineLimit(1)
            .minimumScaleFactor(minimumScaleFactor)
        }
    }
}

@available(iOSApplicationExtension 16.1, *)
private struct CompactActivityEyebrowText: View {
    let context: ActivityViewContext<LiveActivityAttributes>

    var body: some View {
        Text(compactActivityEyebrow(for: context))
            .lineLimit(1)
            .minimumScaleFactor(0.66)
    }
}

@available(iOSApplicationExtension 16.1, *)
struct IllnessDayText: View {
    let startedAt: Date
    let font: Font
    let languageCode: String?

    var body: some View {
        Text(illnessDayLabel(startedAt: startedAt, languageCode: languageCode))
            .font(font)
            .monospacedDigit()
            .multilineTextAlignment(.trailing)
            .lineLimit(2)
            .minimumScaleFactor(0.8)
    }
}

@available(iOSApplicationExtension 16.1, *)
private struct OpenActivityLink: View {
    let url: URL?
    let compact: Bool
    let languageCode: String?

    var body: some View {
        Group {
            if let url {
                Link(destination: url) {
                    HStack(spacing: compact ? 6 : 8) {
                        Image(systemName: "arrow.up.right")
                        Text(liveActivityText("Открыть", "Open", languageCode))
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
    if let statusLabel = context.state.statusLabel, !statusLabel.isEmpty {
        return statusLabel
    }
    if let subtitle = context.state.subtitle, !subtitle.isEmpty {
        return subtitle
    }

    switch context.attributes.kind {
    case "sleep":
        return liveActivityText("Сон", "Sleep", context.state.language)
    case "feeding":
        return liveActivityText("Кормление", "Feeding", context.state.language)
    case "illness":
        return liveActivityText("Наблюдение", "Illness", context.state.language)
    default:
        return liveActivityText("Активность", "Activity", context.state.language)
    }
}

@available(iOSApplicationExtension 16.1, *)
private func activitySubtitle(for context: ActivityViewContext<LiveActivityAttributes>) -> String {
    let startedAtText = startedAtLabel(context.state.startedAt, languageCode: context.state.language)

    switch context.attributes.kind {
    case "sleep":
        return liveActivityText("С \(startedAtText)", "Since \(startedAtText)", context.state.language)
    case "feeding":
        return liveActivityText("С \(startedAtText)", "Since \(startedAtText)", context.state.language)
    case "illness":
        return activityTitle(for: context)
    default:
        return activityTitle(for: context)
    }
}

@available(iOSApplicationExtension 16.1, *)
private func compactActivityEyebrow(for context: ActivityViewContext<LiveActivityAttributes>) -> String {
    switch context.attributes.kind {
    case "sleep":
        return liveActivityText("Сон", "Sleep", context.state.language)
    case "feeding":
        return liveActivityText("Еда", "Feed", context.state.language)
    case "illness":
        return activityTitle(for: context)
    default:
        return activityTitle(for: context)
    }
}

@available(iOSApplicationExtension 16.1, *)
func sleepReferenceSubtitle(for context: ActivityViewContext<LiveActivityAttributes>) -> String {
    let startedAtText = startedAtLabel(context.state.startedAt, languageCode: context.state.language)
    return liveActivityText("Спит с \(startedAtText)", "Sleeping since \(startedAtText)", context.state.language)
}

@available(iOSApplicationExtension 16.1, *)
func feedingReferenceSubtitle(for context: ActivityViewContext<LiveActivityAttributes>) -> String {
    let startedAtText = startedAtLabel(context.state.startedAt, languageCode: context.state.language)
    return liveActivityText("Начато в \(startedAtText)", "Started at \(startedAtText)", context.state.language)
}

@available(iOSApplicationExtension 16.1, *)
func illnessReferenceSubtitle(for context: ActivityViewContext<LiveActivityAttributes>) -> String {
    let startedAtText = startedAtDateLabel(context.state.startedAt, languageCode: context.state.language)
    return liveActivityText("Наблюдение с \(startedAtText)", "Tracking since \(startedAtText)", context.state.language)
}

@available(iOSApplicationExtension 16.1, *)
private func startedAtLabel(_ date: Date, languageCode: String? = nil) -> String {
    let formatter = DateFormatter()
    formatter.locale = liveActivityUsesRussian(languageCode) ? Locale(identifier: "ru_RU") : Locale(identifier: "en_US")
    formatter.dateFormat = "HH:mm"
    return formatter.string(from: date)
}

@available(iOSApplicationExtension 16.1, *)
private func startedAtDateLabel(_ date: Date, languageCode: String? = nil) -> String {
    let formatter = DateFormatter()
    formatter.locale = liveActivityUsesRussian(languageCode) ? Locale(identifier: "ru_RU") : Locale(identifier: "en_US")
    formatter.dateFormat = "d MMM"
    return formatter.string(from: date)
}

@available(iOSApplicationExtension 16.1, *)
func iconName(for kind: String) -> String {
    switch kind {
    case "sleep":
        return "moon.stars.fill"
    case "feeding":
        return "drop.fill"
    case "illness":
        return "cross.case.fill"
    default:
        return "circle.fill"
    }
}

@available(iOSApplicationExtension 16.1, *)
func activityAccentColor(for kind: String) -> Color {
    switch kind {
    case "sleep":
        return Color(red: 0.43, green: 0.40, blue: 0.85)
    case "feeding":
        return Color(red: 0.94, green: 0.48, blue: 0.28)
    case "illness":
        return Color(red: 0.22, green: 0.64, blue: 0.60)
    default:
        return .white
    }
}

@available(iOSApplicationExtension 16.1, *)
private func backgroundGradient(for kind: String) -> LinearGradient {
    if kind == "sleep" {
        return LinearGradient(
            colors: [
                Color(red: 0.14, green: 0.18, blue: 0.31),
                Color(red: 0.18, green: 0.24, blue: 0.40),
                Color(red: 0.12, green: 0.16, blue: 0.28)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    if kind == "illness" {
        return LinearGradient(
            colors: [
                Color(red: 0.19, green: 0.15, blue: 0.30),
                Color(red: 0.24, green: 0.18, blue: 0.37),
                Color(red: 0.16, green: 0.12, blue: 0.27)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    return LinearGradient(
        colors: [
            Color(red: 0.32, green: 0.18, blue: 0.12),
            Color(red: 0.40, green: 0.24, blue: 0.15),
            Color(red: 0.26, green: 0.15, blue: 0.09)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

@available(iOSApplicationExtension 16.1, *)
private func illnessDayNumber(startedAt: Date) -> Int {
    max(1, (Calendar.current.dateComponents([.day], from: startedAt, to: Date()).day ?? 0) + 1)
}

@available(iOSApplicationExtension 16.1, *)
private func illnessDayLabel(startedAt: Date, languageCode: String? = nil) -> String {
    let days = illnessDayNumber(startedAt: startedAt)
    if liveActivityUsesRussian(languageCode) {
        return illnessDurationPhrase(startedAt: startedAt, languageCode: languageCode)
    }
    return "Day \(days)"
}

@available(iOSApplicationExtension 16.1, *)
func illnessDurationPhrase(startedAt: Date, languageCode: String? = nil) -> String {
    let days = illnessDayNumber(startedAt: startedAt)
    if !liveActivityUsesRussian(languageCode) {
        return days == 1 ? "1 day" : "\(days) days"
    }
    let remainder10 = days % 10
    let remainder100 = days % 100

    let suffix: String
    if remainder10 == 1 && remainder100 != 11 {
        suffix = "день"
    } else if (2...4).contains(remainder10) && !(12...14).contains(remainder100) {
        suffix = "дня"
    } else {
        suffix = "дней"
    }

    return "\(days) \(suffix)"
}

@available(iOSApplicationExtension 16.1, *)
private func compactIllnessDayLabel(startedAt: Date, languageCode: String? = nil) -> String {
    liveActivityUsesRussian(languageCode)
        ? "\(illnessDayNumber(startedAt: startedAt))д"
        : "D\(illnessDayNumber(startedAt: startedAt))"
}

@available(iOSApplicationExtension 16.1, *)
private func abbreviatedElapsedLabel(startedAt: Date, now: Date, languageCode: String? = nil) -> String {
    let elapsedSeconds = max(0, Int(now.timeIntervalSince(startedAt)))
    let minutes = elapsedSeconds / 60
    let hours = minutes / 60
    let days = hours / 24

    if days > 0 {
        return liveActivityUsesRussian(languageCode) ? "\(days)д" : "\(days)d"
    }
    if hours > 0 {
        return liveActivityUsesRussian(languageCode) ? "\(hours)ч" : "\(hours)h"
    }
    let visibleMinutes = max(1, minutes)
    return liveActivityUsesRussian(languageCode) ? "\(visibleMinutes)м" : "\(visibleMinutes)m"
}

@available(iOSApplicationExtension 16.1, *)
func elapsedClockLabel(startedAt: Date, now: Date, languageCode: String? = nil) -> String {
    let elapsedSeconds = max(0, Int(now.timeIntervalSince(startedAt)))
    let days = elapsedSeconds / 86_400
    let hours = (elapsedSeconds % 86_400) / 3_600
    let minutes = (elapsedSeconds % 3_600) / 60
    let seconds = elapsedSeconds % 60

    if days > 0 {
        let dayLabel = durationDayLabel(days: days, languageCode: languageCode)
        if hours > 0 {
            return liveActivityUsesRussian(languageCode) ? "\(dayLabel) \(hours) ч" : "\(dayLabel) \(hours) hr"
        }
        return dayLabel
    }
    if hours > 0 {
        return liveActivityUsesRussian(languageCode)
            ? "\(hours) ч \(minutes) мин"
            : "\(hours) hr \(minutes) min"
    }
    if minutes > 0 {
        return liveActivityUsesRussian(languageCode)
            ? "\(minutes) мин \(seconds) сек"
            : "\(minutes) min \(seconds) sec"
    }
    return liveActivityUsesRussian(languageCode) ? "\(seconds) сек" : "\(seconds) sec"
}

@available(iOSApplicationExtension 16.1, *)
private func durationDayLabel(days: Int, languageCode: String? = nil) -> String {
    if !liveActivityUsesRussian(languageCode) {
        return days == 1 ? "1 day" : "\(days) days"
    }

    let remainder10 = days % 10
    let remainder100 = days % 100

    let suffix: String
    if remainder10 == 1 && remainder100 != 11 {
        suffix = "день"
    } else if (2...4).contains(remainder10) && !(12...14).contains(remainder100) {
        suffix = "дня"
    } else {
        suffix = "дней"
    }

    return "\(days) \(suffix)"
}
