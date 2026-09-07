package com.whereisit.api.repository;

import com.whereisit.api.entity.OtpToken;
import com.whereisit.api.entity.OtpType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    Optional<OtpToken> findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(String email, OtpType type);

    @Transactional
    @Modifying
    @Query("DELETE FROM OtpToken o WHERE o.email = :email AND o.type = :type")
    void deleteByEmailAndType(@Param("email") String email, @Param("type") OtpType type);
}
