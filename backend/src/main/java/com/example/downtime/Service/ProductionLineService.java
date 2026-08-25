package com.example.downtime.Service;

import com.example.downtime.Entities.ProductionLine;
import com.example.downtime.Exception.ProductionLineNotFoundException;
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

    public ProductionLine getProductionLineById(Long id) {
        return productionLineRepository.findById(id)
                .orElseThrow(() -> new ProductionLineNotFoundException(id));
    }

    public ProductionLine createProductionLine(ProductionLine productionLine) {
        return productionLineRepository.save(productionLine);
    }

    public ProductionLine updateProductionLine(Long id, ProductionLine updatedProductionLine) {
        ProductionLine existingProductionLine = productionLineRepository.findById(id)
            .orElseThrow(() -> new ProductionLineNotFoundException(id));;

        existingProductionLine.setName(updatedProductionLine.getName());
        existingProductionLine.setLocation(updatedProductionLine.getLocation());

        return productionLineRepository.save(existingProductionLine);
    }

    public void deleteProductionLine(Long id) {
        ProductionLine productionLine = productionLineRepository.findById(id)
                .orElseThrow(() -> new ProductionLineNotFoundException(id));

        productionLineRepository.delete(productionLine);
    }
}