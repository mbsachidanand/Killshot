//
//  ContentView.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif


struct ContentView: View {
    // Sample data for the groups
    private let groups = ["Group 1", "Group 2", "Group 3", "Group 4"]
    @State private var showingAddExpense = false
    
    var body: some View {
        NavigationView {
            mainContent
        }
        #if os(iOS)
        .fullScreenCover(isPresented: $showingAddExpense) {
            AddExpenseView()
        }
        #else
        .sheet(isPresented: $showingAddExpense) {
            AddExpenseView()
        }
        #endif
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
            showingAddExpense = true
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
        VStack(spacing: 8) {
            ForEach(Array(groups.enumerated()), id: \.offset) { index, group in
                groupRow(for: group, at: index)
            }
        }
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
            .background(Color.white)
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
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

// MARK: - Add Expense View
struct AddExpenseView: View {
    @State private var title = "Expense 1"
    @State private var amount = "250"
    @State private var paidBy = "Rishab (me)"
    @State private var when = "7 Sept 2025"
    @State private var group = "Group 1"
    @State private var splitType = "Equally"
    
    // Sample participants data
    private let participants = [
        ("Person 1", 62.5),
        ("Person 2", 62.5),
        ("Person 3", 62.5),
        ("Person 4", 62.5)
    ]
    
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 0) {
            // Navigation header
            HStack {
                Button("Cancel") {
                    dismiss()
                }
                .foregroundColor(.blue)
                .font(.title3)
                .fontWeight(.medium)
                
                Spacer()
                
                Text("Add expense")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                // Invisible button to balance the layout
                Button("Cancel") {
                    dismiss()
                }
                .foregroundColor(.clear)
                .disabled(true)
            }
            .padding(.horizontal, 20)
            .padding(.top, 80)
            .padding(.bottom, 16)
            .background(Color.gray.opacity(0.05))
            
            // Main content with light grey background
            VStack(spacing: 0) {
                // Input fields section
                VStack(spacing: 20) {
                    inputField(label: "Title", text: $title, placeholder: "Expense 1")
                    
                    amountField
                    
                    // Paid by and When side by side
                    HStack(spacing: 16) {
                        dropdownField(label: "Paid by", value: $paidBy, options: ["Rishab (me)", "Person 2", "Person 3", "Person 4"])
                        
                        dropdownField(label: "When", value: $when, options: ["7 Sept 2025", "6 Sept 2025", "8 Sept 2025"])
                    }
                    
                    dropdownField(label: "Group", value: $group, options: ["Group 1", "Group 2", "Group 3", "Group 4"])
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 20)
                .background(Color.gray.opacity(0.05))
                
                // Split among section
                splitAmongSection
                
                Spacer()
                
                // Add button
                addButton
            }
            .background(Color.gray.opacity(0.05))
        }
        .background(Color.gray.opacity(0.05))
        .ignoresSafeArea(.all, edges: .all)
    }
    
    // MARK: - Amount Field
    private var amountField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Amount")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
            
            HStack(spacing: 8) {
                // Currency symbol in its own separate white box
                Text("₹")
                    .font(.body)
                    .foregroundColor(.primary)
                    .frame(width: 50, height: 50)
                    .background(Color.white)
                    .cornerRadius(12)
                
                // Amount field in its own separate white box
                TextField("0", text: $amount)
                    #if canImport(UIKit)
                    .keyboardType(UIKeyboardType.decimalPad)
                    #endif
                    .font(.body)
                    .padding(.horizontal, 16)
                    .frame(height: 50)
                    .background(Color.white)
                    .cornerRadius(12)
            }
        }
    }
    
    // MARK: - Input Field
    private func inputField(label: String, text: Binding<String>, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
            
            TextField(placeholder, text: text)
                .font(.body)
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(Color.white)
                .cornerRadius(12)
        }
    }
    
    // MARK: - Dropdown Field
    private func dropdownField(label: String, value: Binding<String>, options: [String]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
            
            HStack {
                Text(value.wrappedValue)
                    .font(.body)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Image(systemName: "chevron.down")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(Color.white)
            .cornerRadius(12)
        }
    }
    
    // MARK: - Split Among Section
    private var splitAmongSection: some View {
        VStack(spacing: 0) {
            // Header without grey background
            HStack {
                Text("Split among")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                Spacer()
                
                HStack {
                    Text(splitType)
                        .font(.subheadline)
                        .foregroundColor(.primary)
                    
                    Image(systemName: "chevron.down")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            
            // Participants list with individual boxes
            VStack(spacing: 8) {
                ForEach(Array(participants.enumerated()), id: \.offset) { index, participant in
                    HStack {
                        Text(participant.0)
                            .font(.body)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        Text("₹\(String(format: "%.1f", participant.1))")
                            .font(.body)
                            .fontWeight(.medium)
                            .foregroundColor(.primary)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .cornerRadius(12)
                }
            }
            .padding(.horizontal, 20)
        }
        .padding(.top, 0)
    }
    
    // MARK: - Add Button
    private var addButton: some View {
        Button(action: {
            // Handle add expense action
            print("Add expense: \(title) - ₹\(amount)")
            dismiss()
        }) {
            Text("Add")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.blue)
                .cornerRadius(12)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }
}

#Preview {
    ContentView()
}
