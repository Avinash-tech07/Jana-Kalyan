package com.janakalyan.app;

import com.janakalyan.model.Account;
import com.janakalyan.model.Admin;
import com.janakalyan.model.Loan;
import com.janakalyan.model.Member;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * JANA KALYAN — Back-office Desktop Application
 * -----------------------------------------------------------------------
 * A Swing desktop app for society staff/admins to manage members, record
 * deposits, run the quarterly interest job, and review Kalyan loan
 * durations — all built on the same OOP model (Member, Admin, Account,
 * Transaction, Loan) that a web API layer would also use against the SQL
 * schema in backend/sql/schema.sql.
 *
 * This demonstrates the "core OOP principles for efficient data handling"
 * required by the spec: encapsulation (Account guards its own balance),
 * inheritance (Member/Admin extend User), and polymorphism
 * (dashboardSummary() differs per user type).
 *
 * To compile & run:
 *   javac -d out com/janakalyan/model/*.java com/janakalyan/db/*.java com/janakalyan/app/*.java
 *   java -cp out com.janakalyan.app.JanaKalyanApp
 */
public class JanaKalyanApp extends JFrame {

    private final List<Member> members = new ArrayList<>();
    private final DefaultTableModel tableModel;
    private final AtomicInteger accountSequence = new AtomicInteger(184213);

    public JanaKalyanApp() {
        super("Jana Kalyan — Back Office");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(760, 480);
        setLocationRelativeTo(null);

        seedDemoData();

        tableModel = new DefaultTableModel(
            new Object[]{"Member ID", "Name", "Account No.", "Balance", "Nominee"}, 0);
        refreshTable();

        JTable table = new JTable(tableModel);
        add(new JScrollPane(table), BorderLayout.CENTER);
        add(buildToolbar(), BorderLayout.NORTH);
    }

    /** Generates a new account number, e.g. JK00184214. Increment on each new member. */
    private String generateAccountNumber() {
        return "JK00" + accountSequence.incrementAndGet();
    }

    private JPanel buildToolbar() {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.LEFT));

        JButton depositBtn = new JButton("Record Deposit");
        depositBtn.addActionListener(e -> recordDeposit());

        JButton interestBtn = new JButton("Run Quarterly Interest Job");
        interestBtn.addActionListener(e -> runQuarterlyInterestJob());

        JButton adminViewBtn = new JButton("Admin: View All Balances");
        adminViewBtn.addActionListener(e -> showAdminView());

        JButton loanBtn = new JButton("Kalyan Loan Calculator");
        loanBtn.addActionListener(e -> showLoanCalculator());

        panel.add(depositBtn);
        panel.add(interestBtn);
        panel.add(adminViewBtn);
        panel.add(loanBtn);
        return panel;
    }

    private void seedDemoData() {
        Account acc1 = new Account(generateAccountNumber(), 24000);
        Member m1 = new Member("JK1001", "Asha Kumari", "asha@example.com", "9800000001", acc1);
        m1.setNomineeName("Rakesh Kumar");
        m1.setNomineeId("AADHAAR-1234-5678");

        Account acc2 = new Account(generateAccountNumber(), 12000);
        Member m2 = new Member("JK1002", "Ravi Prasad", "ravi@example.com", "9800000002", acc2);
        m2.setNomineeName("Sunita Devi");
        m2.setNomineeId("AADHAAR-9876-5432");

        members.add(m1);
        members.add(m2);
    }

    private void refreshTable() {
        tableModel.setRowCount(0);
        for (Member m : members) {
            tableModel.addRow(new Object[]{
                m.getUserId(), m.getFullName(), m.getAccount().getAccountNo(),
                String.format("%.2f", m.getAccount().getBalance()),
                m.getNomineeName() != null ? m.getNomineeName() : "—"
            });
        }
    }

    private void recordDeposit() {
        int row = -1; // simplified: always acts on the first member for this demo
        if (members.isEmpty()) return;
        String amountStr = JOptionPane.showInputDialog(this, "Deposit amount for " + members.get(0).getFullName() + ":");
        if (amountStr == null || amountStr.isBlank()) return;
        try {
            double amount = Double.parseDouble(amountStr);
            members.get(0).getAccount().deposit(amount, "Counter Deposit");
            refreshTable();
        } catch (NumberFormatException ex) {
            JOptionPane.showMessageDialog(this, "Please enter a valid number.");
        }
    }

    /** Applies 4% quarterly interest to every account, if today is a quarter-end date. */
    private void runQuarterlyInterestJob() {
        int applied = 0;
        for (Member m : members) {
            if (m.getAccount().applyQuarterlyInterestIfDue(LocalDate.now())) applied++;
        }
        refreshTable();
        JOptionPane.showMessageDialog(this,
            applied > 0
                ? "Quarterly interest applied to " + applied + " account(s)."
                : "Today is not a quarter-end date (31/03, 30/06, 30/09, 31/12), so nothing was applied.");
    }

    private void showAdminView() {
        Admin admin = new Admin("ADMIN01", "Society Admin", "admin@janakalyan.org", "9999999999");
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        java.io.PrintStream original = System.out;
        System.setOut(new java.io.PrintStream(out));
        admin.printAllMemberBalances(members);
        System.setOut(original);

        JTextArea area = new JTextArea(out.toString());
        area.setEditable(false);
        area.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        JOptionPane.showMessageDialog(this, new JScrollPane(area), "Admin: All Member Balances", JOptionPane.PLAIN_MESSAGE);
    }

    private void showLoanCalculator() {
        String[] amounts = {"6000", "12000", "18000", "24000", "60000", "360000"};
        String amountStr = (String) JOptionPane.showInputDialog(this, "Loan amount:",
            "Kalyan Loan Calculator", JOptionPane.PLAIN_MESSAGE, null, amounts, amounts[3]);
        if (amountStr == null) return;
        double amount = Double.parseDouble(amountStr);

        List<Integer> durations = Loan.durationsFor(amount);
        Integer months = (Integer) JOptionPane.showInputDialog(this, "Duration (months):",
            "Kalyan Loan Calculator", JOptionPane.PLAIN_MESSAGE, null, durations.toArray(), durations.get(0));
        if (months == null) return;

        Loan loan = new Loan("LOAN" + System.currentTimeMillis(), members.get(0).getUserId(), amount, months);
        JOptionPane.showMessageDialog(this, String.format(
            "Amount: %.2f%nRate: 13%% p.a.%nDuration: %d months%nTotal payable: %.2f%nMonthly instalment: %.2f",
            amount, months, loan.totalPayable(), loan.monthlyInstalment()
        ));
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new JanaKalyanApp().setVisible(true));
    }
}
