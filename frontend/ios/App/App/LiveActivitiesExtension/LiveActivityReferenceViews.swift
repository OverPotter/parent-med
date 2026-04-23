import ActivityKit
import WidgetKit
import SwiftUI
import CapApp_SPM

@available(iOSApplicationExtension 16.1, *)
struct FeedingReferenceLockScreenView: View {
    let context: ActivityViewContext<LiveActivityAttributes>
    let deepLink: URL?

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 29, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.97, green: 0.87, blue: 0.80),
                            Color(red: 0.96, green: 0.82, blue: 0.73),
                            Color(red: 0.95, green: 0.79, blue: 0.69)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color.white.opacity(0.20),
                                    Color.white.opacity(0.04),
                                    Color.clear
                                ],
                                center: .topLeading,
                                startRadius: 10,
                                endRadius: 210
                            )
                        )
                )
                .overlay(
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.99, green: 0.92, blue: 0.88).opacity(0.16),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 6,
                                endRadius: 70
                            )
                        )
                        .frame(width: 148, height: 148)
                        .offset(x: -118, y: 84)
                )
                .overlay(
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.97, green: 0.70, blue: 0.54).opacity(0.10),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 6,
                                endRadius: 88
                            )
                        )
                        .frame(width: 156, height: 156)
                        .offset(x: 144, y: -72)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.12),
                                    Color.white.opacity(0.03),
                                    Color.clear,
                                    Color.white.opacity(0.03)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.68), lineWidth: 1.1)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .inset(by: 1.2)
                        .strokeBorder(Color(red: 0.92, green: 0.72, blue: 0.60).opacity(0.24), lineWidth: 0.9)
                )
                .shadow(color: Color.white.opacity(0.08), radius: 8, x: -2, y: -2)
                .shadow(color: Color(red: 0.86, green: 0.58, blue: 0.43).opacity(0.14), radius: 16, x: 0, y: 8)
                .shadow(color: Color.black.opacity(0.10), radius: 20, x: 0, y: 12)

            HStack(alignment: .center, spacing: 16) {
                ReferenceActivityBody(
                    accentColor: Color(red: 0.94, green: 0.48, blue: 0.28),
                    label: "Кормление",
                    title: context.state.title,
                    subtitle: feedingReferenceSubtitle(for: context),
                    detailText: nil,
                    titleTopOffset: 0,
                    titleFontSize: 24,
                    titleMinScale: 0.78,
                    secondaryTextColor: Color(red: 0.55, green: 0.43, blue: 0.39),
                    subtitleMinScale: 0.85,
                    badge: { FeedingIconBadge() },
                    value: {
                        HeaderElapsedTimerText(startedAt: context.state.startedAt)
                    },
                    trailing: {
                        ReferenceActivityOpenChip(
                            url: deepLink,
                            foregroundOpacity: 0.56,
                            backgroundOpacity: 0.22,
                            strokeOpacity: 0.24
                        )
                    }
                )
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
        }
        .widgetURL(deepLink)
    }
}

@available(iOSApplicationExtension 16.1, *)
struct SleepReferenceLockScreenView: View {
    let context: ActivityViewContext<LiveActivityAttributes>
    let deepLink: URL?

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 29, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.84, green: 0.89, blue: 0.98),
                            Color(red: 0.75, green: 0.81, blue: 0.96),
                            Color(red: 0.64, green: 0.72, blue: 0.93)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.78, green: 0.88, blue: 1.0).opacity(0.12),
                                    Color(red: 0.78, green: 0.88, blue: 1.0).opacity(0.02),
                                    Color.clear
                                ],
                                center: .topLeading,
                                startRadius: 14,
                                endRadius: 220
                            )
                        )
                )
                .overlay(
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.63, green: 0.60, blue: 0.92).opacity(0.045),
                                    Color(red: 0.63, green: 0.60, blue: 0.92).opacity(0.008),
                                    Color.clear,
                                ],
                                center: .center,
                                startRadius: 10,
                                endRadius: 72
                            )
                        )
                        .frame(width: 136, height: 136)
                        .offset(x: -92, y: 88)
                )
                .overlay(
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.60, green: 0.83, blue: 1.0).opacity(0.18),
                                    Color(red: 0.60, green: 0.83, blue: 1.0).opacity(0.03),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 6,
                                endRadius: 88
                            )
                        )
                        .frame(width: 156, height: 156)
                        .offset(x: 144, y: -76)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.04),
                                    Color.white.opacity(0.005),
                                    Color.clear,
                                    Color.white.opacity(0.01)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .mask(
                            RoundedRectangle(cornerRadius: 29, style: .continuous)
                                .fill(.white)
                                .overlay(
                                    Capsule(style: .continuous)
                                        .fill(.white)
                                        .frame(width: 240, height: 52)
                                        .rotationEffect(.degrees(-16))
                                        .offset(x: 36, y: -46)
                                        .blur(radius: 1.2)
                                )
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.78), lineWidth: 1.35)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .inset(by: 1.2)
                        .strokeBorder(Color(red: 0.62, green: 0.70, blue: 0.95).opacity(0.24), lineWidth: 1)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .inset(by: 3)
                        .strokeBorder(Color.white.opacity(0.12), lineWidth: 0.75)
                )
                .shadow(color: Color.white.opacity(0.14), radius: 8, x: -2, y: -2)
                .shadow(color: Color(red: 0.55, green: 0.66, blue: 0.95).opacity(0.12), radius: 18, x: 0, y: 8)
                .shadow(color: Color.black.opacity(0.14), radius: 24, x: 0, y: 13)

            HStack(alignment: .center, spacing: 16) {
                ReferenceActivityBody(
                    accentColor: Color(red: 0.40, green: 0.38, blue: 0.82),
                    label: "Сон",
                    title: context.state.title,
                    subtitle: sleepReferenceSubtitle(for: context),
                    detailText: nil,
                    titleTopOffset: 0,
                    titleFontSize: 24,
                    titleMinScale: 0.78,
                    secondaryTextColor: Color(red: 0.49, green: 0.47, blue: 0.60),
                    subtitleMinScale: 0.85,
                    badge: { SleepIconBadge() },
                    value: {
                        HeaderElapsedTimerText(startedAt: context.state.startedAt)
                    },
                    trailing: {
                        ReferenceActivityOpenChip(
                            url: deepLink,
                            foregroundOpacity: 0.62,
                            backgroundOpacity: 0.28,
                            strokeOpacity: 0.34
                        )
                    }
                )
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
        }
        .widgetURL(deepLink)
    }
}

@available(iOSApplicationExtension 16.1, *)
struct IllnessReferenceLockScreenView: View {
    let context: ActivityViewContext<LiveActivityAttributes>
    let deepLink: URL?

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 29, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.90, green: 0.95, blue: 0.92),
                            Color(red: 0.87, green: 0.93, blue: 0.90),
                            Color(red: 0.84, green: 0.91, blue: 0.88)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color.white.opacity(0.22),
                                    Color.white.opacity(0.05),
                                    Color.clear
                                ],
                                center: .topLeading,
                                startRadius: 12,
                                endRadius: 210
                            )
                        )
                )
                .overlay(
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.62, green: 0.87, blue: 0.82).opacity(0.12),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 8,
                                endRadius: 84
                            )
                        )
                        .frame(width: 150, height: 150)
                        .offset(x: -118, y: 84)
                )
                .overlay(
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.49, green: 0.82, blue: 0.72).opacity(0.08),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 8,
                                endRadius: 94
                            )
                        )
                        .frame(width: 160, height: 160)
                        .offset(x: 144, y: -76)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.14),
                                    Color.white.opacity(0.04),
                                    Color.clear,
                                    Color.white.opacity(0.02)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.72), lineWidth: 1.1)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 29, style: .continuous)
                        .inset(by: 1.2)
                        .strokeBorder(Color(red: 0.22, green: 0.64, blue: 0.60).opacity(0.22), lineWidth: 0.9)
                )
                .shadow(color: Color.white.opacity(0.08), radius: 8, x: -2, y: -2)
                .shadow(color: Color(red: 0.22, green: 0.64, blue: 0.60).opacity(0.12), radius: 16, x: 0, y: 8)
                .shadow(color: Color.black.opacity(0.10), radius: 20, x: 0, y: 12)

            HStack(alignment: .center, spacing: 16) {
                ReferenceActivityBody(
                    accentColor: Color(red: 0.22, green: 0.64, blue: 0.60),
                    label: "Болезнь",
                    title: context.state.title,
                    subtitle: illnessReferenceSummary(for: context),
                    detailText: illnessReferenceDetail(for: context),
                    titleTopOffset: -1.2,
                    titleFontSize: 22,
                    titleMinScale: 0.66,
                    secondaryTextColor: Color(red: 0.44, green: 0.50, blue: 0.49),
                    subtitleMinScale: 0.68,
                    badge: { IllnessIconBadge() },
                    value: {
                        IllnessReferenceMetricBlock(context: context)
                    },
                    trailing: {
                        ReferenceActivityOpenChip(
                            url: deepLink,
                            foregroundOpacity: 0.56,
                            backgroundOpacity: 0.24,
                            strokeOpacity: 0.26
                        )
                    }
                )
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
        }
        .widgetURL(deepLink)
    }
}

@available(iOSApplicationExtension 16.1, *)
private struct IllnessReferenceMetricBlock: View {
    let context: ActivityViewContext<LiveActivityAttributes>

    var body: some View {
        VStack(alignment: .trailing, spacing: 4) {
            VStack(alignment: .trailing, spacing: 1) {
                Text(primaryText)
                    .font(.system(size: 24, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(red: 0.22, green: 0.64, blue: 0.60))
                    .shadow(color: Color.white.opacity(0.14), radius: 1, x: 0, y: -1)
                    .lineLimit(1)
                    .minimumScaleFactor(0.74)

                if let primaryCaption, !primaryCaption.isEmpty {
                    Text(primaryCaption)
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(Color(red: 0.44, green: 0.50, blue: 0.49))
                        .lineLimit(1)
                        .minimumScaleFactor(0.76)
                }
            }
        }
    }

    private var primaryText: String {
        let trimmed = context.state.primaryValue?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !trimmed.isEmpty {
            return trimmed
        }
        return illnessDurationPhrase(startedAt: context.state.startedAt)
    }

    private var secondaryText: String? {
        let value = context.state.secondaryValue?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !value.isEmpty else {
            return nil
        }

        let caption = context.state.secondaryCaption?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return caption.isEmpty ? value : "\(caption) · \(value)"
    }
    private var primaryCaption: String? {
        let caption = context.state.primaryCaption?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return caption.isEmpty ? nil : caption
    }
}

@available(iOSApplicationExtension 16.1, *)
struct ReferenceActivityBody<Badge: View, Value: View, Trailing: View>: View {
    let accentColor: Color
    let label: String
    let title: String
    let subtitle: String
    let detailText: String?
    let titleTopOffset: CGFloat
    let titleFontSize: CGFloat
    let titleMinScale: CGFloat
    let secondaryTextColor: Color
    let subtitleMinScale: CGFloat
    @ViewBuilder let badge: Badge
    @ViewBuilder let value: Value
    @ViewBuilder let trailing: Trailing

    var body: some View {
        let hasLowerMeta = !subtitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || !(detailText?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true)

        badge

        Rectangle()
            .fill(accentColor.opacity(0.26))
            .frame(width: 1, height: 100)

        VStack(alignment: .leading, spacing: hasLowerMeta ? 6 : 3) {
            HStack(alignment: .top, spacing: 8) {
                HStack(spacing: 7) {
                    Text(label)
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundStyle(accentColor)
                    Circle()
                        .fill(Color(red: 0.36, green: 0.80, blue: 0.48))
                        .frame(width: 9, height: 9)
                }

                Spacer(minLength: 10)

                value
                    .font(.system(size: 24, weight: .semibold, design: .rounded))
                    .foregroundStyle(accentColor)
                    .shadow(color: Color.white.opacity(0.14), radius: 1, x: 0, y: -1)
                    .lineLimit(1)
                    .minimumScaleFactor(0.74)
            }

            Text(title)
                .font(.system(size: titleFontSize, weight: .semibold, design: .rounded))
                .foregroundStyle(Color.black.opacity(0.80))
                .lineLimit(1)
                .minimumScaleFactor(titleMinScale)
                .padding(.top, hasLowerMeta ? titleTopOffset : titleTopOffset - 2)

            if hasLowerMeta {
                HStack(alignment: .center, spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        if !subtitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            Text(subtitle)
                                .font(.system(size: 15, weight: .regular, design: .rounded))
                                .foregroundStyle(secondaryTextColor)
                                .lineLimit(1)
                                .minimumScaleFactor(subtitleMinScale)
                        }

                        if let detailText, !detailText.isEmpty {
                            Text(detailText)
                                .font(.system(size: 13, weight: .regular, design: .rounded))
                                .foregroundStyle(secondaryTextColor.opacity(0.95))
                                .lineLimit(1)
                                .minimumScaleFactor(0.76)
                        }
                    }

                    Spacer(minLength: 8)
                    trailing
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

@available(iOSApplicationExtension 16.1, *)
private func illnessReferenceSummary(for context: ActivityViewContext<LiveActivityAttributes>) -> String {
    let statusLabel = context.state.statusLabel?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if !statusLabel.isEmpty {
        return statusLabel
    }
    return ""
}

@available(iOSApplicationExtension 16.1, *)
private func illnessReferenceDetail(for context: ActivityViewContext<LiveActivityAttributes>) -> String? {
    let subtitle = context.state.subtitle?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    return subtitle.isEmpty ? nil : subtitle
}

@available(iOSApplicationExtension 16.1, *)
struct FeedingIconBadge: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(Color(red: 0.94, green: 0.48, blue: 0.28).opacity(0.16))
                .overlay(
                    Circle()
                        .strokeBorder(Color(red: 0.94, green: 0.48, blue: 0.28).opacity(0.14), lineWidth: 1)
                )

            FeedingBottleIcon()
                .frame(width: 26, height: 32)
                .rotationEffect(.degrees(14))
                .offset(x: 0.5, y: 0.5)
        }
        .frame(width: 68, height: 68)
    }
}

@available(iOSApplicationExtension 16.1, *)
struct SleepIconBadge: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(Color(red: 0.43, green: 0.40, blue: 0.85).opacity(0.16))
                .overlay(
                    Circle()
                        .strokeBorder(Color(red: 0.43, green: 0.40, blue: 0.85).opacity(0.14), lineWidth: 1)
                )

            Image(systemName: "moon.fill")
                .font(.system(size: 28, weight: .semibold))
                .foregroundStyle(Color(red: 0.43, green: 0.40, blue: 0.85))
                .rotationEffect(.degrees(60))
                .offset(x: 1, y: 0.5)
        }
        .frame(width: 68, height: 68)
    }
}

@available(iOSApplicationExtension 16.1, *)
struct IllnessIconBadge: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(Color(red: 0.22, green: 0.64, blue: 0.60).opacity(0.16))
                .overlay(
                    Circle()
                        .strokeBorder(Color(red: 0.22, green: 0.64, blue: 0.60).opacity(0.14), lineWidth: 1)
                )

            Image(systemName: "thermometer.medium")
                .font(.system(size: 32, weight: .semibold))
                .foregroundStyle(Color(red: 0.22, green: 0.64, blue: 0.60))
                .rotationEffect(.degrees(18))
                .offset(x: 0.5, y: 0.5)
        }
        .frame(width: 68, height: 68)
    }
}

@available(iOSApplicationExtension 16.1, *)
struct HeaderElapsedTimerText: View {
    let startedAt: Date

    var body: some View {
        Text(startedAt, style: .timer)
            .font(.system(size: 24, weight: .semibold, design: .rounded))
            .monospacedDigit()
            .multilineTextAlignment(.trailing)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
    }
}

@available(iOSApplicationExtension 16.1, *)
struct FeedingBottleIcon: View {
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(Color(red: 0.94, green: 0.48, blue: 0.28))
                .frame(width: 18, height: 22)
                .offset(y: 5)

            RoundedRectangle(cornerRadius: 3, style: .continuous)
                .fill(Color(red: 0.94, green: 0.48, blue: 0.28))
                .frame(width: 8, height: 7)
                .offset(y: -9)

            Capsule(style: .continuous)
                .fill(Color(red: 0.98, green: 0.73, blue: 0.56))
                .frame(width: 7, height: 5)
                .offset(y: -14)

            Capsule(style: .continuous)
                .fill(Color.white.opacity(0.24))
                .frame(width: 2.5, height: 12)
                .offset(x: -4, y: 6)
        }
    }
}

struct ReferenceActivityOpenChip: View {
    let url: URL?
    let foregroundOpacity: Double
    let backgroundOpacity: Double
    let strokeOpacity: Double

    var body: some View {
        Link(destination: url ?? URL(string: "pillpath://open")!) {
            HStack(spacing: 0) {
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundStyle(Color.black.opacity(foregroundOpacity))
            .frame(width: 30, height: 30)
            .background(
                Circle()
                    .fill(Color.white.opacity(backgroundOpacity))
            )
            .overlay(
                Circle()
                    .strokeBorder(Color.white.opacity(strokeOpacity), lineWidth: 0.8)
            )
        }
    }
}

@available(iOSApplicationExtension 16.1, *)
struct CompactActivityGlyph: View {
    let kind: String
    let size: CGFloat

    var body: some View {
        Group {
            switch kind {
            case "sleep":
                Image(systemName: "moon.fill")
                    .font(.system(size: size, weight: .bold))
                    .foregroundStyle(activityAccentColor(for: kind))
                    .rotationEffect(.degrees(60))
            case "feeding":
                FeedingBottleCompactGlyph(color: activityAccentColor(for: kind))
                    .frame(width: size + 2, height: size + 4)
                    .rotationEffect(.degrees(14))
            case "illness":
                Image(systemName: "thermometer.medium")
                    .font(.system(size: size + 1, weight: .semibold))
                    .foregroundStyle(activityAccentColor(for: kind))
                    .rotationEffect(.degrees(18))
            default:
                Image(systemName: iconName(for: kind))
                    .font(.system(size: size, weight: .bold))
                    .foregroundStyle(activityAccentColor(for: kind))
            }
        }
    }
}

@available(iOSApplicationExtension 16.1, *)
struct FeedingBottleCompactGlyph: View {
    let color: Color

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 3.5, style: .continuous)
                .fill(color)
                .frame(width: 7, height: 9)
                .offset(y: 1.8)

            RoundedRectangle(cornerRadius: 1.6, style: .continuous)
                .fill(color)
                .frame(width: 3.6, height: 3)
                .offset(y: -4)

            Capsule(style: .continuous)
                .fill(color.opacity(0.76))
                .frame(width: 3.2, height: 2.2)
                .offset(y: -6.3)
        }
    }
}

@available(iOSApplicationExtension 16.1, *)
struct ActivityIcon: View {
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
            CompactActivityGlyph(kind: kind, size: size * 0.42)
        }
        .frame(width: size, height: size)
    }
}
