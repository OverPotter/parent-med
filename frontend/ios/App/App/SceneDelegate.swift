import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene,
               willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        print("[PM][iOS] scene willConnectTo")
        guard let windowScene = scene as? UIWindowScene else {
            return
        }

        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = AppViewController()
        self.window = window
        window.makeKeyAndVisible()
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        print("[PM][iOS] sceneDidBecomeActive")
    }

    func sceneWillResignActive(_ scene: UIScene) {
        print("[PM][iOS] sceneWillResignActive")
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        print("[PM][iOS] sceneWillEnterForeground")
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        print("[PM][iOS] sceneDidEnterBackground")
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let context = URLContexts.first else {
            return
        }

        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            open: context.url,
            options: [:]
        )
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            continue: userActivity,
            restorationHandler: { _ in }
        )
    }
}
