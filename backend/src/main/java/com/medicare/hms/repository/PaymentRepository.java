package com.medicare.hms.repository;

import com.medicare.hms.entity.Payment;
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
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentReference(String paymentReference);

    boolean existsByPaymentReference(String paymentReference);

    List<Payment> findByBillIdOrderByPaymentTimestampDesc(Long billId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS' " +
           "AND p.paymentTimestamp >= :start AND p.paymentTimestamp <= :end")
    BigDecimal sumAmountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p FROM Payment p WHERE " +
           "(:billId IS NULL OR p.bill.id = :billId) AND " +
           "(:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) AND " +
           "(:startDate IS NULL OR p.paymentTimestamp >= :startDate) AND " +
           "(:endDate IS NULL OR p.paymentTimestamp <= :endDate)")
    Page<Payment> findWithFilters(@Param("billId") Long billId,
                                  @Param("paymentMethod") String paymentMethod,
                                  @Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate,
                                  Pageable pageable);
}
