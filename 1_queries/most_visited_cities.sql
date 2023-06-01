SELECT p.city AS city_name, COUNT(*) AS reservation_count
FROM properties p
JOIN reservations r ON p.id = r.property_id
GROUP BY p.city
ORDER BY reservation_count DESC;
