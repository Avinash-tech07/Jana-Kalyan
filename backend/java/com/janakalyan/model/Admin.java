package com.janakalyan.model;

import java.util.List;

/**
 * Society administrator. Extends User (INHERITANCE) and adds the
 * privilege — required by the spec — of viewing every member's deposits
 * and current balance in one place.
 */
public class Admin extends User {

    public Admin(String userId, String fullName, String email, String phone) {
        super(userId, fullName, email, phone);
    }

    /** Spec: "The Admin must be able to view each member's deposit and balance." */
    public void printAllMemberBalances(List<Member> members) {
        System.out.println("Member ID   | Name                 | Total Deposits | Balance");
        System.out.println("------------|----------------------|----------------|--------");
        for (Member m : members) {
            double totalDeposits = m.getAccount().getAccountStatement().stream()
                .filter(t -> t.getType() == Transaction.Type.DEPOSIT)
                .mapToDouble(Transaction::getAmount)
                .sum();
            System.out.printf("%-12s| %-21s| %-15.2f| %.2f%n",
                m.getUserId(), m.getFullName(), totalDeposits, m.getAccount().getBalance());
        }
    }

    @Override
    public String dashboardSummary() {
        return "Admin: " + getFullName();
    }
}
