import Foundation
import Capacitor
import AuthenticationServices
import Security
import UIKit

@objc(PasswordAutofillPlugin)
public final class PasswordAutofillPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PasswordAutofillPlugin"
    public let jsName = "PasswordAutofill"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveCredential", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestCredential", returnType: CAPPluginReturnPromise)
    ]

    private let defaultDomains = [
        "parent-med-production-frontend.up.railway.app",
        "pillpath-production-frontend.up.railway.app"
    ]
    private var pendingAuthorizationCall: CAPPluginCall?
    private var authorizationControllerDelegate: AuthorizationControllerDelegate?

    @objc func saveCredential(_ call: CAPPluginCall) {
        guard let username = call.getString("username")?.trimmingCharacters(in: .whitespacesAndNewlines),
              !username.isEmpty else {
            call.reject("username is required")
            return
        }
        guard let password = call.getString("password"), !password.isEmpty else {
            call.reject("password is required")
            return
        }

        let domains = normalizedDomains(from: call.getArray("domains", String.self))
        let group = DispatchGroup()
        var savedDomains: [String] = []
        var lastError: CFError?

        for domain in domains {
            group.enter()
            SecAddSharedWebCredential(domain as CFString, username as CFString, password as CFString) { error in
                if let error {
                    lastError = error
                } else {
                    savedDomains.append(domain)
                }
                group.leave()
            }
        }

        group.notify(queue: .main) {
            if savedDomains.isEmpty {
                let description = lastError.flatMap { CFErrorCopyDescription($0) as String? }
                    ?? "Failed to save shared web credential"
                call.reject(description)
                return
            }

            call.resolve([
                "savedDomains": savedDomains
            ])
        }
    }

    @objc func requestCredential(_ call: CAPPluginCall) {
        if pendingAuthorizationCall != nil {
            call.reject("Password autofill request is already in progress")
            return
        }

        guard let bridgeViewController = bridge?.viewController else {
            call.reject("Bridge view controller is unavailable")
            return
        }

        pendingAuthorizationCall = call

        DispatchQueue.main.async {
            let provider = ASAuthorizationPasswordProvider()
            let request = provider.createRequest()
            let delegate = AuthorizationControllerDelegate(
                bridgeViewController: bridgeViewController,
                onSuccess: { [weak self] credential in
                    self?.pendingAuthorizationCall?.resolve([
                        "username": credential.user,
                        "password": credential.password,
                        "canceled": false
                    ])
                    self?.pendingAuthorizationCall = nil
                    self?.authorizationControllerDelegate = nil
                },
                onCancel: { [weak self] in
                    self?.pendingAuthorizationCall?.resolve([
                        "canceled": true
                    ])
                    self?.pendingAuthorizationCall = nil
                    self?.authorizationControllerDelegate = nil
                },
                onFailure: { [weak self] error in
                    self?.pendingAuthorizationCall?.reject("Password autofill failed", nil, error)
                    self?.pendingAuthorizationCall = nil
                    self?.authorizationControllerDelegate = nil
                }
            )
            self.authorizationControllerDelegate = delegate

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = delegate
            controller.presentationContextProvider = delegate
            controller.performRequests()
        }
    }

    private func normalizedDomains(from rawDomains: [String]?) -> [String] {
        let domains = (rawDomains ?? defaultDomains)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        if domains.isEmpty {
            return defaultDomains
        }
        return Array(NSOrderedSet(array: domains)) as? [String] ?? defaultDomains
    }
}

private final class AuthorizationControllerDelegate: NSObject,
    ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding
{
    private weak var bridgeViewController: UIViewController?
    private let onSuccess: (ASPasswordCredential) -> Void
    private let onCancel: () -> Void
    private let onFailure: (Error) -> Void

    init(
        bridgeViewController: UIViewController,
        onSuccess: @escaping (ASPasswordCredential) -> Void,
        onCancel: @escaping () -> Void,
        onFailure: @escaping (Error) -> Void
    ) {
        self.bridgeViewController = bridgeViewController
        self.onSuccess = onSuccess
        self.onCancel = onCancel
        self.onFailure = onFailure
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        bridgeViewController?.view.window ?? ASPresentationAnchor()
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let credential = authorization.credential as? ASPasswordCredential else {
            onFailure(NSError(domain: "PasswordAutofillPlugin", code: -1, userInfo: [
                NSLocalizedDescriptionKey: "Unexpected authorization credential type"
            ]))
            return
        }
        onSuccess(credential)
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        let nsError = error as NSError
        if nsError.domain == ASAuthorizationError.errorDomain,
           nsError.code == ASAuthorizationError.canceled.rawValue {
            onCancel()
            return
        }
        onFailure(error)
    }
}
