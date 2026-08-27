package com.example.downtime.Service;

import com.example.downtime.Entities.DowntimeReason;
import com.example.downtime.Exception.DowntimeReasonNotFoundException;
import com.example.downtime.Repository.DowntimeReasonRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DowntimeReasonService {

    private final DowntimeReasonRepository downtimeReasonRepository;

    public DowntimeReasonService(
            DowntimeReasonRepository downtimeReasonRepository
    ) {
        this.downtimeReasonRepository = downtimeReasonRepository;
    }

    public List<DowntimeReason> getAllDowntimeReasons() {
        return downtimeReasonRepository.findAll();
    }

    public DowntimeReason getDowntimeReasonById(Long id) {
        return downtimeReasonRepository.findById(id)
                .orElseThrow(() ->
                        new DowntimeReasonNotFoundException(id)
                );
    }

    public DowntimeReason createDowntimeReason(
            DowntimeReason downtimeReason
    ) {
        downtimeReason.setId(null);
        return downtimeReasonRepository.save(downtimeReason);
    }

    public DowntimeReason updateDowntimeReason(
            Long id,
            DowntimeReason updatedReason
    ) {
        DowntimeReason existingReason =
                getDowntimeReasonById(id);

        existingReason.setName(updatedReason.getName());
        existingReason.setDescription(updatedReason.getDescription());
        existingReason.setCategory(updatedReason.getCategory());
        existingReason.setPlanned(updatedReason.isPlanned());

        return downtimeReasonRepository.save(existingReason);
    }

    public void deleteDowntimeReason(Long id) {

        DowntimeReason existingReason =
                getDowntimeReasonById(id);

        downtimeReasonRepository.delete(existingReason);
    }
}