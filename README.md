# RFP to 2D/3D/BOM Studio

[한국어](#한국어) | [English](#english)

Live demo: https://rfp-to-2d-3d-bom-studio.ai.studio/

## 한국어

### 프로젝트 개요

RFP to 2D/3D/BOM Studio는 W Company의 D+AX 전환전략에서 제안한 90일 현장 실증 프로그램을 화면과 계산 로직으로 구현한 바이브 코딩 데모입니다.

이 프로젝트는 대형 플랜트 및 압력용기 제작 과정에서 분리되어 있는 제안요청서와 사양, 승인도면, 부재, 절단·마킹, 작업·검사 기록, 납기 및 원가 정보를 하나의 흐름으로 연결하는 가능성을 보여줍니다. 실제 현장 도입 전, 핵심 업무 흐름과 사용자 화면을 빠르게 검토하고 실증 범위를 구체화하기 위한 프로토타입입니다.

초기 데모는 바이브 코딩 방식으로 하루도 채 걸리지 않아 구현했습니다. 이 개발 속도는 현업 아이디어를 즉시 작동 화면으로 바꾸고 관계자와 실증 범위를 논의할 수 있다는 바이브 코딩의 가능성을 보여줍니다. 다만 짧은 개발기간에 만든 프로토타입이므로 상용 시스템의 정확성, 안전성, 보안성 및 현장 연계 수준은 별도의 검증과 개발이 필요합니다.

발표덱에서 정의한 90일 우선 실증 4대 기능의 업무 범위를 기준으로 보면, 본 데모는 관련 기능의 90% 이상을 화면 또는 모의 로직으로 표현하도록 설계했습니다. 이 수치는 기능 항목 기준의 설계 추정치이며, 현장 성능이나 상용화 완성도를 의미하지 않습니다.

### 90일 실증 프로그램 4대 전략기능

| 전략기능 | 90일 실증의 목적 | 데모 구현 내용 | 현재 수준 |
| --- | --- | --- | --- |
| 1. 설계통제 | 승인기준, 책임분담, 도면 개정 기준선과 변경영향을 통제 | RFP·기술사양 표시, 2D 파라미터 편집, 2D·3D 연동, 변환 정합성 화면, 사양 명세서 출력 | 화면·규칙 기반 데모 |
| 2. 디지털 작업패키지 | 수주번호, 설비번호, 부재번호와 작업·검사 정보를 연결 | 설비·부재 정보, 재질·치수·용접조건, BOM, 2D·3D 객체 선택 연동, 작업정보 표시 | 프런트엔드 프로토타입 |
| 3. 절단·직접마킹 | 승인정보를 절단·마킹 데이터로 변환하고 판독성과 재작업을 검증 | 부재 전개도, 절단선·용접선·조립방향 마킹, QR 검증 화면, ISO/EIA 6983 G-code·ESSI·DXF 생성 및 다운로드 | 파일 생성·모의 전송 데모 |
| 4. 현장 무부하 통합진도 | 정상작업의 추가 입력을 줄이고 착수·완료·예외 증거를 자동 수집 | 작업·검사 상태, 품질 판정, 납기 부풀림 분석, 예상 원가 및 KPI 검토 화면 | 샘플 데이터 기반 데모 |

### 주요 기능

#### RFP 및 사양 검토

- RFP 또는 기술 규격서의 요구조건 입력 화면
- 설계압력, 설계온도, 재질, 용접조건, 검사요건과 적용규격 표시
- 제작 사양 명세서 텍스트 다운로드
- 표준 CAD 프리셋 선택과 사용자 파라미터 적용

#### 2D 도면과 3D 모델 연동

- 파라메트릭 2D 도면 생성 및 치수 수정
- 2D 파라미터를 Three.js 3D 모델에 반영
- 2D와 3D 객체의 양방향 선택 표시
- 화면 분할비 조정 및 모바일 2D·3D 전환
- DXF, SVG, STL, OBJ 형식 내보내기
- 형상 파라미터, 체적 및 예상 질량의 비교 화면

#### 사양 명세서와 BOM

- 도면 파라미터에 따른 자재 및 부품 내역 산출
- 품번, 품명, 규격, 재질, 수량, 중량, 단가, 가공공정 표시
- 파라미터 변경 시 BOM 중량 및 예상금액 재계산
- Excel 호환 CSV 내보내기

#### 부재 마킹과 NC 절단 데이터

- 쉘 플레이트와 주요 부재의 전개 형상 시각화
- 외곽 절단선, 용접 개선선, 조립기준선, 롤링 방향 및 식별문자 표시
- QR 기반 부재 및 승인정보 확인 화면
- ISO/EIA 6983 G-code와 ESSI 코드 생성
- 네스팅용 다중 레이어 DXF 파일 생성
- NC 코드 미리보기, 복사 및 다운로드

#### 납기 부풀림 감사와 원가 검토

- 용접 길이, 용착량, 표준 공수 및 제작기간 계산
- 엔지니어 제출 납기와 계산 납기의 차이 분석
- 지연 여유일수와 주요 원인 항목 표시
- 재료비, 용접 소모품비, 노무비, 검사·열처리비, 가공비 및 운송비 추정
- 품질검사 매트릭스와 상태 표시
- 감사 결과의 CSV 및 인쇄용 보고서 출력

### 데모 이용 흐름

1. 표준 설비 또는 플랜지 프리셋을 선택합니다.
2. RFP 요구사항을 입력하거나 도면 업로드 화면을 확인합니다.
3. 2D 도면의 치수와 부재 정보를 검토합니다.
4. 3D 모델에서 형상, 단면 및 구성품을 확인합니다.
5. 사양 명세서와 BOM을 검토하고 필요한 형식으로 내려받습니다.
6. 부재 전개·마킹 화면에서 NC 코드, ESSI 및 DXF 데이터를 생성합니다.
7. 납기·원가 감사 화면에서 제출값과 계산값의 차이를 검토합니다.

### 기술 구성

- React 19
- TypeScript
- Vite 6
- Three.js
- Tailwind CSS 4
- Motion
- Lucide React

### 로컬 실행

필수 환경:

- Node.js 20 이상 또는 호환되는 Bun 환경
- npm 또는 Bun

```bash
git clone https://github.com/jooshiklee-youngspirit/AX_EXPERT.git
cd AX_EXPERT
npm install
npm run dev
```

기본 개발 서버는 `http://localhost:3000`에서 실행됩니다.

빌드 및 타입 검사:

```bash
npm run lint
npm run build
```

### 현재 데모의 범위와 제한사항

- 현재 RFP·도면 분석 버튼은 고정된 예시 파라미터를 반환하는 시연 로직입니다. 실제 문서 OCR, 도면 해석 또는 Gemini 기반 구조화 추출은 후속 구현이 필요합니다.
- 업로드 화면에 표시된 모든 파일 형식이 실제 파싱되는 것은 아닙니다. 특히 DWG 처리에는 별도의 CAD 변환 엔진이 필요합니다.
- NC 장비 전송, ERP·MES 등록 및 QR 승인 처리는 실제 외부 시스템과 연결되지 않은 모의 동작입니다.
- 납기, 원가, 공수와 품질 수치는 샘플 데이터와 가정식에 따른 설계 추정값입니다. W Company의 확정 실적이나 승인된 표준값이 아닙니다.
- 화면의 `PASS`, 정합률 및 품질 판정은 프로토타입 내부 규칙의 결과입니다. 생산도면 승인, 구조·압력 설계 검증 또는 법정검사를 대체하지 않습니다.
- 실제 설비 적용 전에는 사용 장비의 컨트롤러 사양, 좌표계, 단위, 원점, 절단 보정, 안전 인터록 및 작업표준을 검증해야 합니다.

### 90일 현장 실증으로 전환하기 위한 후속 과제

- 승인도면, 개정번호, 수주·설비·부재번호를 연결하는 공통 데이터 모델 확정
- 실제 RFP와 도면을 이용한 OCR·문서 구조화·치수 추출 정확도 검증
- 절단기 제조사 및 컨트롤러별 NC 포스트프로세서 개발
- 직접마킹의 재질 영향, 후공정 판독률, 작업시간과 재작업률 시험
- 작업 착수·완료·검사·예외 이벤트의 자동 수집과 ERP·MES 연계
- 최초 4주 기준선 측정 후 KPI, 목표값 및 중단조건 재승인
- 생산·품질·설계·재무 책임자의 결과 검증과 D90 확대·보완·중단 결정

### 보안 및 데이터 주의사항

실제 RFP, 고객 도면, 계약금액, 원가, 개인정보, API 키 또는 생산정보를 공개 저장소에 커밋하지 마십시오. 운영 데이터는 익명화하고, 비밀정보는 서버 측 환경변수 또는 별도 보안 저장소에서 관리해야 합니다.

### 프로젝트 배경

이 데모는 W Company D+AX 전환전략을 수립한 프로젝트팀 제안의 실행 가능성을 점검하기 위해 제작했습니다. 전문가의 바이브 코딩 특강은 비개발자가 아이디어를 하루도 채 걸리지 않아 작동하는 프로토타입으로 구현하는 데 중요한 출발점이 되었습니다.

W Company가 90일 실증을 통해 기능별 효과와 현장 수용성을 검증하고, 통과한 기능부터 단계적으로 확대하기를 기대합니다.

---

## English

### Overview

RFP to 2D/3D/BOM Studio is a vibe-coded demonstration of the 90-day field validation program proposed in the D+AX transformation strategy for W Company.

The application explores how a heavy-plant and pressure-vessel manufacturer could connect RFP requirements, specifications, approved drawings, physical parts, cutting and marking data, work and inspection records, delivery estimates, and cost information in one traceable workflow. It is a prototype for reviewing the target workflow and defining a field pilot before production implementation.

The initial demo was built through vibe coding in less than one day. This rapid build demonstrates how an operational concept can become a working interface quickly enough to support stakeholder review and pilot scoping. Because it was created in such a short period, production-grade accuracy, safety, security, and system integration still require separate engineering and validation.

Based on a feature-by-feature mapping, the demo was designed to represent more than 90% of the functional scope of the four priority workstreams in the 90-day program through interactive screens or simulated logic. This is a design estimate of functional coverage. It is not a verified measure of field performance or production readiness.

### Four strategic functions for the 90-day pilot

| Strategic function | Pilot objective | Demonstrated capabilities | Current maturity |
| --- | --- | --- | --- |
| 1. Engineering control | Control approval criteria, responsibilities, drawing revision baselines, and change impact | RFP and specification views, editable 2D parameters, linked 2D and 3D views, conversion checks, and specification export | UI and rule-based demo |
| 2. Digital work package | Link order, equipment, and part identifiers to work and inspection information | Equipment and part data, material and weld conditions, BOM, linked object selection, and work information | Front-end prototype |
| 3. Cutting and direct marking | Convert approved information into cutting and marking data and test readability and rework | Plate development, cutting and assembly marks, QR verification UI, ISO/EIA 6983 G-code, ESSI, and DXF generation | File generation and simulated transfer |
| 4. Low-burden progress capture | Reduce manual input and capture start, completion, and exception evidence | Work and inspection status, quality decisions, lead-time padding analysis, cost estimates, and KPI review | Sample-data demo |

### Key capabilities

#### RFP and specification review

- RFP and technical specification input interface
- Display of design pressure, temperature, material, welding conditions, inspection requirements, and applicable codes
- Text export of the manufacturing specification
- Standard CAD presets and editable parameters

#### Linked 2D drawing and 3D model

- Parametric 2D drawing generation and dimension editing
- Real-time reflection of 2D parameters in a Three.js 3D model
- Bidirectional highlighting between 2D and 3D objects
- Adjustable split view and mobile 2D/3D switching
- DXF, SVG, STL, and OBJ export
- Comparison of geometry parameters, volume, and estimated mass

#### Specification sheet and BOM

- Material and component list derived from drawing parameters
- Part number, description, specification, material, quantity, weight, unit cost, and process fields
- Automatic recalculation of BOM weight and estimated amount after parameter changes
- Excel-compatible CSV export

#### Part marking and NC cutting data

- Developed plate geometry for shell plates and major components
- Cutting contours, weld preparation lines, assembly baselines, rolling direction, and identification text
- QR-based part and approval-information verification interface
- ISO/EIA 6983 G-code and ESSI code generation
- Multi-layer DXF generation for nesting software
- NC code preview, copy, and download

#### Lead-time padding audit and cost review

- Calculation of weld length, deposited metal, standard labor hours, and production duration
- Comparison of engineer-submitted lead time with the calculated estimate
- Identification of schedule padding and major delay drivers
- Estimated material, welding consumable, labor, inspection, heat-treatment, machining, and transport costs
- Quality inspection matrix and status display
- CSV and printable audit report export

### Demo workflow

1. Select a standard equipment or flange preset.
2. Enter RFP requirements or review the drawing-upload interface.
3. Review dimensions and part information in the 2D drawing.
4. Inspect geometry, sections, and components in the 3D viewer.
5. Review and export the specification sheet and BOM.
6. Generate NC, ESSI, and DXF data from the plate-development and marking view.
7. Compare submitted and calculated values in the lead-time and cost audit.

### Technology stack

- React 19
- TypeScript
- Vite 6
- Three.js
- Tailwind CSS 4
- Motion
- Lucide React

### Local setup

Requirements:

- Node.js 20 or later, or a compatible Bun environment
- npm or Bun

```bash
git clone https://github.com/jooshiklee-youngspirit/AX_EXPERT.git
cd AX_EXPERT
npm install
npm run dev
```

The development server runs at `http://localhost:3000` by default.

Build and type-check:

```bash
npm run lint
npm run build
```

### Demo scope and limitations

- The current RFP and drawing analysis action returns predefined sample parameters. Production OCR, drawing interpretation, and Gemini-based structured extraction require further implementation.
- Not every file type shown in the upload interface is parsed. DWG processing requires a separate CAD conversion engine.
- NC machine transfer, ERP or MES registration, and QR approval are simulated and are not connected to external production systems.
- Lead-time, cost, labor-hour, and quality figures are design estimates based on sample data and assumptions. They are not approved standards or verified performance data of W Company.
- `PASS`, fit, and quality results reflect prototype rules. They do not replace engineering approval, pressure or structural design verification, machine simulation, or statutory inspection.
- Before machine use, validate the target controller, coordinate system, units, origin, kerf compensation, safety interlocks, and operating procedures.

### Work required for a field pilot

- Define a common data model linking approved drawings, revisions, orders, equipment, and part identifiers
- Validate OCR, document structuring, and dimension extraction using controlled RFP and drawing samples
- Develop controller-specific NC post-processors with cutting-machine suppliers
- Test marking durability, material impact, downstream readability, cycle time, and rework
- Capture work-start, completion, inspection, and exception events and integrate them with ERP or MES
- Measure the first four-week baseline and reapprove KPIs, targets, and stop criteria
- Obtain design, production, quality, and finance sign-off before the D90 scale, revise, or stop decision

### Security and data handling

Do not commit real RFPs, customer drawings, contract prices, cost data, personal information, API keys, or production records to a public repository. Anonymize operational data and store secrets in server-side environment variables or a dedicated secret manager.

### Background

This demo was created to test the practical implementation of the recommendations developed by project team for the D+AX transformation strategy of W Company. A professional vibe-coding workshop helped provide the confidence to turn the concept into a working prototype in less than one day.

The intended next step is a controlled 90-day pilot in which W Company validates business value and shop-floor adoption by function, then scales only the functions that pass the agreed criteria.

## Disclaimer

This repository contains a demonstration prototype for concept validation and discussion. It is not production-ready CAD, CAM, quality, scheduling, or cost-control software. All sample projects, organizations, people, identifiers, prices, schedules, and performance figures are fictional, anonymized, or illustrative unless explicitly stated otherwise.
