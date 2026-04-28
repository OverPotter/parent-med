import Foundation
import Capacitor
import UIKit

@objc(NativeFileSharePlugin)
public final class NativeFileSharePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeFileSharePlugin"
    public let jsName = "NativeFileShare"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "shareFile", returnType: CAPPluginReturnPromise)
    ]

    @objc func shareFile(_ call: CAPPluginCall) {
        guard let filename = call.getString("filename"), !filename.isEmpty else {
            call.reject("filename is required")
            return
        }
        guard let base64 = call.getString("base64"), !base64.isEmpty else {
            call.reject("base64 is required")
            return
        }

        let normalizedBase64: String
        if let commaIndex = base64.firstIndex(of: ",") {
            normalizedBase64 = String(base64[base64.index(after: commaIndex)...])
        } else {
            normalizedBase64 = base64
        }

        guard let data = Data(base64Encoded: normalizedBase64) else {
            call.reject("base64 payload is invalid")
            return
        }

        let tempDirectory = FileManager.default.temporaryDirectory
        let exportDirectory = tempDirectory.appendingPathComponent("exports", isDirectory: true)
        let fileUrl = exportDirectory.appendingPathComponent(filename, isDirectory: false)

        do {
            try FileManager.default.createDirectory(at: exportDirectory, withIntermediateDirectories: true)
            try data.write(to: fileUrl, options: .atomic)
        } catch {
            call.reject("Failed to write export file", nil, error)
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let bridgeViewController = self?.bridge?.viewController else {
                call.reject("Bridge view controller is unavailable")
                return
            }
            if bridgeViewController.presentedViewController != nil {
                call.reject("Can't share while another modal is active")
                return
            }

            let activityController = UIActivityViewController(
                activityItems: [fileUrl],
                applicationActivities: nil
            )
            activityController.setValue(filename, forKey: "subject")
            activityController.completionWithItemsHandler = { activityType, completed, _, activityError in
                if let activityError {
                    call.reject("Error sharing item", nil, activityError)
                    return
                }
                if completed {
                    call.resolve([
                        "activityType": activityType?.rawValue ?? "",
                        "completed": true,
                        "canceled": false
                    ])
                } else {
                    call.resolve([
                        "activityType": activityType?.rawValue ?? "",
                        "completed": false,
                        "canceled": true
                    ])
                }
            }

            self?.setCenteredPopover(activityController)
            bridgeViewController.present(activityController, animated: true)
        }
    }
}
