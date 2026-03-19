-- เพิ่ม discountPct ใน bet_rates (ส่วนลด % ต่อประเภทการแทง)
ALTER TABLE `bet_rates`
  ADD COLUMN `discount_pct` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'ส่วนลด % (0–100)';

-- เพิ่ม discountPct และ discountAmount ใน bet_items (บันทึกส่วนลด ณ เวลาแทง)
ALTER TABLE `bet_items`
  ADD COLUMN `discount_pct`    DECIMAL(5,2)  NOT NULL DEFAULT 0.00 COMMENT 'ส่วนลด %',
  ADD COLUMN `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดส่วนลด (บาท)';
