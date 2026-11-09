import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGCS,
  calculateCURB65,
  calculateAlvarado,
  calculateCHA2DS2VASc,
  calculateQSOFA,
} from './medicalCalculators.ts';

test('calculateGCS correctly scores consciousness and recommends intubation for GCS <= 8', () => {
  // Normal GCS = 15
  const normal = calculateGCS(4, 5, 6);
  assert.equal(normal.score, 15);
  assert.equal(normal.riskLevel, 'Thấp');

  // Severe / Coma GCS = 7
  const severe = calculateGCS(2, 2, 3);
  assert.equal(severe.score, 7);
  assert.equal(severe.riskLevel, 'Rất cao');
  assert.match(severe.recommendation, /đặt nội khí quản/i);
});

test('calculateCURB65 stratifies CAP severity accurately', () => {
  // Low risk (score 0)
  const low = calculateCURB65(false, false, false, false, false);
  assert.equal(low.score, 0);
  assert.equal(low.riskLevel, 'Thấp');

  // Moderate risk (score 2)
  const mod = calculateCURB65(true, false, true, false, false);
  assert.equal(mod.score, 2);
  assert.equal(mod.riskLevel, 'Trung bình');

  // High risk (score 4)
  const high = calculateCURB65(true, true, true, true, false);
  assert.equal(high.score, 4);
  assert.equal(high.riskLevel, 'Rất cao');
});

test('calculateAlvarado identifies appendicitis likelihood', () => {
  // Classic appendicitis: RLQ tenderness (2) + Leukocytosis (2) + Migratory pain (1) + Rebound (1) + Fever (1) = 7
  const classic = calculateAlvarado({
    migratoryPain: true,
    anorexia: false,
    nauseaVomiting: false,
    rlqTenderness: true,
    reboundTenderness: true,
    fever: true,
    leukocytosis: true,
    neutrophilShift: false,
  });
  assert.equal(classic.score, 7);
  assert.equal(classic.riskLevel, 'Rất cao');
  assert.match(classic.recommendation, /phẫu thuật/i);
});

test('calculateCHA2DS2VASc recommends anticoagulation for high stroke risk', () => {
  // 76-year old male with hypertension and stroke = 1 (HTN) + 2 (Age >= 75) + 2 (Stroke) = 5
  const highRisk = calculateCHA2DS2VASc({
    age: 76,
    gender: 'male',
    heartFailure: false,
    hypertension: true,
    strokeTIAThrombo: true,
    vascularDisease: false,
    diabetes: false,
  });
  assert.equal(highRisk.score, 5);
  assert.equal(highRisk.riskLevel, 'Cao');
  assert.match(highRisk.recommendation, /thuốc kháng đông/i);
});

test('calculateQSOFA alerts on sepsis when score >= 2', () => {
  // RR >= 22 and SBP <= 100 = 2
  const positive = calculateQSOFA(true, false, true);
  assert.equal(positive.score, 2);
  assert.equal(positive.riskLevel, 'Rất cao');
  assert.match(positive.recommendation, /Sepsis/i);
});
