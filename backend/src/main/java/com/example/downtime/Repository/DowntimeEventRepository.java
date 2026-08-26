package com.example.downtime.Repository;

import com.example.downtime.Entities.DowntimeEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DowntimeEventRepository extends JpaRepository<DowntimeEvent, Long> {

    List<DowntimeEvent> findByMachineId(Long machineId);
}