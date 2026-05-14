const fs = require("fs");
const path = require("path");
const {
  IOSConfig,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
  createRunOncePlugin,
} = require("@expo/config-plugins");

const { getProjectName } = require("@expo/config-plugins/build/ios/utils/Xcodeproj");

const EXTENSION_NAME_SUFFIX = "LiveActivitiesExtension";
const MODULE_POD_NAME = "ParentMedLiveActivities";

function getExtensionTargetName(projectName) {
  return `${projectName}${EXTENSION_NAME_SUFFIX}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyWidgetSourceFiles({ projectRoot, extensionDir, targetName }) {
  const sourceDir = path.resolve(
    projectRoot,
    "../frontend/ios/App/App/LiveActivitiesExtension",
  );
  const activityAttributesPath = path.resolve(
    projectRoot,
    "modules/live-activities/ios/LiveActivityAttributes.swift",
  );
  const sharedAttributesSource = fs
    .readFileSync(activityAttributesPath, "utf8")
    .replace(/^import Foundation\s*/m, "")
    .replace(/^#if canImport\(ActivityKit\)\s*import ActivityKit\s*/m, "")
    .replace(/^#endif\s*/m, "");
  const files = [
    "LiveActivitiesBundle.swift",
    "SleepFeedingLiveActivityWidget.swift",
    "LiveActivityReferenceViews.swift",
  ];

  for (const fileName of files) {
    const sourcePath = path.join(sourceDir, fileName);
    let contents = fs.readFileSync(sourcePath, "utf8");
    contents = contents
      .replace(/^import CapApp_SPM\s*$/m, "")
      .replace(/^import ParentMedLiveActivities\s*$/m, "");
    if (fileName === "SleepFeedingLiveActivityWidget.swift") {
      contents = `${contents.trimEnd()}\n\n${sharedAttributesSource.trim()}\n`;
    }
    fs.writeFileSync(path.join(extensionDir, fileName), contents);
  }

  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>Live Activities</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${targetName}</string>
  <key>CFBundlePackageType</key>
  <string>XPC!</string>
  <key>CFBundleShortVersionString</key>
  <string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key>
  <string>$(CURRENT_PROJECT_VERSION)</string>
  <key>MinimumOSVersion</key>
  <string>16.1</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
</dict>
</plist>
`;

  fs.writeFileSync(
    path.join(extensionDir, `${targetName}-Info.plist`),
    infoPlist,
  );
}

function withLiveActivitiesFiles(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectName = getProjectName(config.modRequest.projectRoot);
      const targetName = getExtensionTargetName(projectName);
      const extensionDir = path.join(
        config.modRequest.platformProjectRoot,
        projectName,
        EXTENSION_NAME_SUFFIX,
      );

      ensureDir(extensionDir);
      copyWidgetSourceFiles({
        projectRoot: config.modRequest.projectRoot,
        extensionDir,
        targetName,
      });

      return config;
    },
  ]);
}

function withLiveActivitiesInfoPlist(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    return config;
  });
}

function withLiveActivitiesTarget(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = getProjectName(config.modRequest.projectRoot);
    const targetName = getExtensionTargetName(projectName);
    const groupName = `${projectName}/${EXTENSION_NAME_SUFFIX}`;
    const extensionBundleId = `${
      config.ios?.bundleIdentifier || "com.pillpath.ios"
    }.${EXTENSION_NAME_SUFFIX}`;

    IOSConfig.XcodeUtils.ensureGroupRecursively(project, groupName);

    let target = project.pbxTargetByName(targetName);
    if (!target) {
      target = project.addTarget(
        targetName,
        "app_extension",
        EXTENSION_NAME_SUFFIX,
        extensionBundleId,
      );
    }

    const targetUuid = target.uuid;
    const fileNames = [
      "LiveActivitiesBundle.swift",
      "SleepFeedingLiveActivityWidget.swift",
      "LiveActivityReferenceViews.swift",
    ];

    for (const fileName of fileNames) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: path.join(projectName, EXTENSION_NAME_SUFFIX, fileName),
        groupName,
        project,
        targetUuid,
      });
    }

    const buildConfigurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      project,
      target.pbxNativeTarget.buildConfigurationList,
    );
    const applicationTarget = IOSConfig.XcodeUtils.getApplicationNativeTarget({
      project,
      projectName,
    });
    const applicationConfigurations =
      IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
        project,
        applicationTarget.target.buildConfigurationList,
      );
    const developmentTeam =
      applicationConfigurations?.find(
        (config) => config?.buildSettings?.DEVELOPMENT_TEAM,
      )?.buildSettings?.DEVELOPMENT_TEAM ?? undefined;
    const marketingVersion =
      applicationConfigurations?.find(
        (config) => config?.buildSettings?.MARKETING_VERSION,
      )?.buildSettings?.MARKETING_VERSION ?? "1.0.0";
    const currentProjectVersion =
      applicationConfigurations?.find(
        (config) => config?.buildSettings?.CURRENT_PROJECT_VERSION,
      )?.buildSettings?.CURRENT_PROJECT_VERSION ?? "1";

    for (const buildConfig of buildConfigurations ?? []) {
      const buildSettings = buildConfig?.buildSettings;
      if (!buildSettings) {
        continue;
      }

      buildSettings.INFOPLIST_FILE = `"${projectName}/${EXTENSION_NAME_SUFFIX}/${targetName}-Info.plist"`;
      buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.1";
      buildSettings.SWIFT_VERSION = "5.0";
      buildSettings.APPLICATION_EXTENSION_API_ONLY = "YES";
      buildSettings.SKIP_INSTALL = "YES";
      buildSettings.TARGETED_DEVICE_FAMILY = '"1"';
      buildSettings.CODE_SIGN_STYLE = "Automatic";
      buildSettings.MARKETING_VERSION = marketingVersion;
      buildSettings.CURRENT_PROJECT_VERSION = currentProjectVersion;
      if (developmentTeam) {
        buildSettings.DEVELOPMENT_TEAM = developmentTeam;
      }
    }

    for (const framework of [
      "SwiftUI.framework",
      "WidgetKit.framework",
      "ActivityKit.framework",
    ]) {
      project.addFramework(framework, { target: targetUuid });
    }

    return config;
  });
}

const withLiveActivities = (config) => {
  config = withLiveActivitiesInfoPlist(config);
  config = withLiveActivitiesFiles(config);
  config = withLiveActivitiesTarget(config);
  return config;
};

module.exports = createRunOncePlugin(
  withLiveActivities,
  "with-live-activities",
  "1.0.0",
);
