package com.medicare.hms.repository;

import com.medicare.hms.entity.Bill;
import com.medicare.hms.entity.BillPaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    Optional<Bill> findByBillNumber(String billNumber);

    boolean existsByBillNumber(String billNumber);

    List<Bill> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    long countByPaymentStatus(BillPaymentStatus status);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.paymentStatus != 'VOID'")
    BigDecimal sumTotalBilled();

    @Query("SELECT COALESCE(SUM(b.paidAmount), 0) FROM Bill b WHERE b.paymentStatus != 'VOID'")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(b.balanceDue), 0) FROM Bill b WHERE b.paymentStatus IN ('UNPAID', 'PARTIALLY_PAID')")
    BigDecimal sumTotalOutstanding();

    @Query("SELECT b FROM Bill b WHERE " +
           "(:patientId IS NULL OR b.patient.id = :patientId) AND " +
           "(:status IS NULL OR b.paymentStatus = :status) AND " +
           "(:startDate IS NULL OR b.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR b.createdAt <= :endDate) AND " +
           "(:search IS NULL OR LOWER(b.billNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Bill> findWithFilters(@Param("patientId") Long patientId,
                               @Param("status") BillPaymentStatus status,
                               @Param("startDate") LocalDateTime startDate,
                               @Param("endDate") LocalDateTime endDate,
                               @Param("search") String search,
                               Pageable pageable);
}
