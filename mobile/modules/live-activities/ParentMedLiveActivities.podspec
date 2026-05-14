require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name           = "ParentMedLiveActivities"
  s.version        = package["version"]
  s.summary        = package["description"]
  s.description    = package["description"]
  s.license        = package["license"]
  s.author         = "OpenAI"
  s.homepage       = "https://example.invalid/parent-med-live-activities"
  s.platforms      = { :ios => "16.1" }
  s.source         = { :git => "https://example.invalid/parent-med-live-activities.git", :tag => s.version.to_s }
  s.static_framework = true
  s.swift_version  = "5.0"

  install_modules_dependencies(s)
  s.dependency "ExpoModulesCore"

  s.source_files = "ios/**/*.{swift,h,m,mm}"
  s.frameworks = ["ActivityKit"]
end
