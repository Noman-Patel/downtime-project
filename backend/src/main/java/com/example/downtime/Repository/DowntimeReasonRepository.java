package com.example.downtime.Repository;

import com.example.downtime.Entities.DowntimeReason;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DowntimeReasonRepository
        extends JpaRepository<DowntimeReason, Long> {
}