package com.example.downtime.Service;

import com.example.downtime.Entities.ProductionLine;
import com.example.downtime.Repository.ProductionLineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductionLineService {

    private final ProductionLineRepository productionLineRepository;

    public ProductionLineService(ProductionLineRepository productionLineRepository) {
        this.productionLineRepository = productionLineRepository;
    }

    public List<ProductionLine> getAllProductionLines() {
        return productionLineRepository.findAll();
    }

    public ProductionLine createProductionLine(ProductionLine productionLine) {
        return productionLineRepository.save(productionLine);
    }
}