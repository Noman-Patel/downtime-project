package com.example.downtime.Repository;

import com.example.downtime.Entities.ProductionLine;
import org.springframework.data.jpa.repository.JpaRepository;

;

public interface ProductionLineRepository
        extends JpaRepository<ProductionLine, Long> {

}