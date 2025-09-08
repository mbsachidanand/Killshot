//
//  ContentView.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

import SwiftUI

struct ContentView: View {
    // Sample data for the groups
    private let groups = ["Group 1", "Group 2", "Group 3", "Group 4"]
    
    var body: some View {
        NavigationView {
            mainContent
        }
    }
    
    // MARK: - Main Content
    private var mainContent: some View {
        VStack(spacing: 0) {
            appTitle
            addExpenseButton
            groupsList
            Spacer()
        }
        .background(Color.gray.opacity(0.1))
        #if os(iOS)
        .toolbar(.hidden, for: .navigationBar)
        #endif
    }
    
    // MARK: - App Title
    private var appTitle: some View {
        Text("App name")
            .font(.largeTitle)
            .fontWeight(.bold)
            .foregroundColor(.primary)
            .padding(.top, 20)
            .padding(.bottom, 30)
    }
    
    // MARK: - Add Expense Button
    private var addExpenseButton: some View {
        Button(action: {
            // Handle add expense action
            print("Add expense tapped")
        }) {
            Text("Add expense")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.blue)
                .cornerRadius(12)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 30)
    }
    
    // MARK: - Groups List
    private var groupsList: some View {
        VStack(spacing: 0) {
            ForEach(Array(groups.enumerated()), id: \.offset) { index, group in
                groupRow(for: group, at: index)
            }
        }
        .background(Color.gray.opacity(0.15))
        .cornerRadius(12)
        .padding(.horizontal, 20)
    }
    
    // MARK: - Group Row
    private func groupRow(for group: String, at index: Int) -> some View {
        NavigationLink(destination: GroupDetailView(groupName: group)) {
            HStack {
                Text(group)
                    .font(.body)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .background(Color.gray.opacity(0.15))
            .overlay(borderOverlay(for: index), alignment: .bottom)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    // MARK: - Border Overlay
    private func borderOverlay(for index: Int) -> some View {
        Rectangle()
            .frame(height: 0.5)
            .foregroundColor(Color.gray.opacity(0.3))
            .offset(y: index == groups.count - 1 ? 0 : 8)
    }
}

// Placeholder view for group detail
struct GroupDetailView: View {
    let groupName: String
    
    var body: some View {
        VStack {
            Text("\(groupName) Details")
                .font(.largeTitle)
                .fontWeight(.bold)
                .padding()
            
            Text("This is a placeholder for \(groupName) details.")
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding()
            
            Spacer()
        }
        .navigationTitle(groupName)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
    }
}

#Preview {
    ContentView()
}
