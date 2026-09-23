// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "LcorgCapacitorSecureStorage",

    platforms: [
        .iOS(.v16)
    ],

    products: [
        .library(
            name: "LcorgCapacitorSecureStorage",
            targets: ["SecureStoragePlugin"]
        )
    ],

    dependencies: [
        .package(
            url: "https://github.com/ionic-team/capacitor-swift-pm.git",
            from: "8.0.0"
        ),
        .package(
            url: "https://github.com/auth0/SimpleKeychain.git",
            from: "1.3.0"
        )
    ],

    targets: [
        .target(
            name: "SecureStoragePlugin",
            dependencies: [
                .product(
                    name: "Capacitor",
                    package: "capacitor-swift-pm"
                ),
                .product(
                    name: "Cordova",
                    package: "capacitor-swift-pm"
                ),
                .product(
                    name: "SimpleKeychain",
                    package: "SimpleKeychain"
                )
            ],
            path: "ios/Sources/SecureStoragePlugin"
        ),

        .testTarget(
            name: "SecureStoragePluginTests",
            dependencies: [
                "SecureStoragePlugin"
            ],
            path: "ios/Tests/SecureStoragePluginTests"
        )
    ]
)
