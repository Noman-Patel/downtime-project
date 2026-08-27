package com.example.downtime.Repository;

import com.example.downtime.Entities.DowntimeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DowntimeEventRepository extends JpaRepository<DowntimeEvent, Long>, JpaSpecificationExecutor<DowntimeEvent> {

}