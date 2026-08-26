package com.example.downtime.Repository;

import com.example.downtime.Entities.Machine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MachineRepository
        extends JpaRepository<Machine, Long> {
}