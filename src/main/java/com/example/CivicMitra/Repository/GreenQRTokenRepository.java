package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.segregation.GreenQRToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GreenQRTokenRepository extends JpaRepository<GreenQRToken,String> {
    List<GreenQRToken> findByHousehold_Ward_WardIdAndIsConsumedFalseOrderByExpiresAtAsc(Long wardId);
    List<GreenQRToken> findByConsumedByWorker_IdOrderByConsumedAtDesc(Long workerId);
}
