//
//  Environment.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

import Foundation
import UIKit

/**
 * AppEnvironment - Manages environment-specific configuration
 *
 * This enum provides a centralized way to manage different environments
 * (development, staging, production) and their respective configurations.
 * It replaces hardcoded values with environment-aware configuration.
 */
enum AppEnvironment {
    case development
    case staging
    case production

    /**
     * Current environment based on build configuration
     * In a real app, this would be determined by build schemes or Info.plist
     */
    static var current: AppEnvironment {
        #if DEBUG
        return .development
        #elseif STAGING
        return .staging
        #else
        return .production
        #endif
    }

    /**
     * Base URL for the API
     * Different URLs for different environments
     */
    var baseURL: String {
        switch self {
        case .development:
            return "http://localhost:3001/api/v1"
        case .staging:
            return "https://api-staging.killshot.app/api/v1"
        case .production:
            return "https://api.killshot.app/api/v1"
        }
    }

    /**
     * API timeout configuration
     * Longer timeouts for development, shorter for production
     */
    var timeoutInterval: TimeInterval {
        switch self {
        case .development:
            return 30.0  // 30 seconds for development
        case .staging:
            return 20.0  // 20 seconds for staging
        case .production:
            return 15.0  // 15 seconds for production
        }
    }

    /**
     * Logging level
     * More verbose logging in development
     */
    var logLevel: LogLevel {
        switch self {
        case .development:
            return .debug
        case .staging:
            return .info
        case .production:
            return .error
        }
    }

    /**
     * Cache configuration
     * Different cache policies for different environments
     */
    var cachePolicy: URLRequest.CachePolicy {
        switch self {
        case .development:
            return .reloadIgnoringLocalCacheData  // Always fetch fresh data in development
        case .staging:
            return .useProtocolCachePolicy
        case .production:
            return .useProtocolCachePolicy
        }
    }

    /**
     * Analytics configuration
     * Enable/disable analytics based on environment
     */
    var analyticsEnabled: Bool {
        switch self {
        case .development:
            return false  // Disable analytics in development
        case .staging:
            return true   // Enable analytics in staging for testing
        case .production:
            return true   // Enable analytics in production
        }
    }

    /**
     * Debug features
     * Enable/disable debug features based on environment
     */
    var debugFeaturesEnabled: Bool {
        switch self {
        case .development:
            return true   // Enable debug features in development
        case .staging:
            return false  // Disable debug features in staging
        case .production:
            return false  // Disable debug features in production
        }
    }
}

/**
 * LogLevel - Defines different logging levels
 */
enum LogLevel: String, CaseIterable {
    case debug = "DEBUG"
    case info = "INFO"
    case warning = "WARNING"
    case error = "ERROR"

    var priority: Int {
        switch self {
        case .debug: return 0
        case .info: return 1
        case .warning: return 2
        case .error: return 3
        }
    }
}

/**
 * Environment Configuration
 *
 * This struct provides easy access to environment-specific values
 * and can be extended to include more configuration options.
 */
struct EnvironmentConfig {
    static let shared = EnvironmentConfig()

    private init() {}

    /// Current environment
    var environment: AppEnvironment {
        return AppEnvironment.current
    }

    /// API base URL for current environment
    var apiBaseURL: String {
        return environment.baseURL
    }

    /// API timeout for current environment
    var apiTimeout: TimeInterval {
        return environment.timeoutInterval
    }

    /// Log level for current environment
    var logLevel: LogLevel {
        return environment.logLevel
    }

    /// Cache policy for current environment
    var cachePolicy: URLRequest.CachePolicy {
        return environment.cachePolicy
    }

    /// Whether analytics is enabled
    var isAnalyticsEnabled: Bool {
        return environment.analyticsEnabled
    }

    /// Whether debug features are enabled
    var areDebugFeaturesEnabled: Bool {
        return environment.debugFeaturesEnabled
    }

    /// App version (from Bundle)
    var appVersion: String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown"
    }

    /// Build number (from Bundle)
    var buildNumber: String {
        return Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown"
    }

    /// App name (from Bundle)
    var appName: String {
        return Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "Killshot"
    }

    /// Device information
    var deviceInfo: String {
        let device = UIDevice.current
        return "\(device.model) (\(device.systemName) \(device.systemVersion))"
    }
}
