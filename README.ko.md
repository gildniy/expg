# EZPG 결제 연동

[English](README.md) | [한국어](README.ko.md)

이 프로젝트는 포인트 기반 시스템을 위한 가상계좌 입금 및 출금을 제공하기 위해 EZPG 결제 게이트웨이와 통합됩니다.

## 프로젝트 구조

이 프로젝트는 Turborepo 기반의 모노레포로 다음과 같은 표준 디렉토리 구조를 가집니다:

- **apps/** - 애플리케이션 디렉토리
  - **api** - EZPG 통합, 웹훅 처리 및 비즈니스 로직을 처리하는 NestJS 백엔드
  - **client** - 고객 및 가맹점 인터페이스를 위한 Next.js 프론트엔드
- **packages/** - 애플리케이션에서 임포트할 수 있는 공유 라이브러리 및 유틸리티

## 시작하기

### 사전 요구사항

- Node.js 16+ 및 Yarn
- PostgreSQL 데이터베이스
- EZPG 가맹점 계정 및 API 자격 증명

### 설정

1. 저장소 클론: `git clone`
2. 의존성 설치: `yarn install`
3. `.env.example`을 `.env`로 복사하고 환경 변수 업데이트
4. 데이터베이스 마이그레이션 실행: `npx prisma migrate dev`
5. 개발 서버 시작: `yarn dev`

API는 `http://localhost:3001/api/v1`에서 사용 가능하며, Swagger 문서는 `http://localhost:3001/api/v1/docs`에서 확인할 수 있습니다.

## 모노레포 사용하기

```bash
# 개발 - 모든 워크스페이스 실행
yarn dev

# 모든 애플리케이션 빌드
yarn build

# 프로덕션 모드로 모든 애플리케이션 시작
yarn start

# 모든 워크스페이스에서 린트 실행
yarn lint

# 테스트 실행
yarn test
yarn test:e2e

# 특정 워크스페이스 작업
yarn workspace @ezpg/api dev
yarn workspace @ezpg/client build
```

## 환경 변수

다음 환경 변수를 설정해야 합니다:

```
# 데이터베이스
DATABASE_URL=postgresql://...

# EZPG 통합
EZPG_MERCHANT_ID=your-ezpg-merchant-id
EZPG_MERCHANT_KEY=your-ezpg-merchant-key
EZPG_API_BASE_URL=https://api.ez-pg.com

# JWT 인증
JWT_SECRET=your-secret-key
JWT_EXPIRATION_TIME=1h

# API 설정
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## API 문서

API는 Swagger/OpenAPI를 사용하여 완전히 문서화되어 있습니다. 다음 주소에서 대화형 문서에 접근할 수 있습니다:
- 개발: `http://localhost:3001/api/v1/docs`
- 프로덕션: `https://your-domain.com/api/v1/docs`

### 오류 처리

API는 표준화된 오류 응답을 사용합니다:

```typescript
{
  statusCode: number;
  message: string;
  error: string;
  details?: any;
}
```

일반적인 HTTP 상태 코드:
- 400: Bad Request - 잘못된 입력
- 401: Unauthorized - 인증 누락 또는 잘못됨
- 403: Forbidden - 권한 부족
- 404: Not Found - 리소스가 존재하지 않음
- 409: Conflict - 리소스 충돌
- 500: Internal Server Error - 서버 측 오류

### API 엔드포인트

#### 인증

- `POST /api/v1/auth/register`: 새 고객 등록
- `POST /api/v1/auth/login`: JWT 토큰을 받기 위한 로그인
- `GET /api/v1/auth/me`: 현재 사용자 프로필 조회

#### 고객

- `GET /api/v1/customer/points`: 현재 포인트 잔액 조회
- `GET /api/v1/customer/virtual-account`: 가상계좌 정보 조회
- `POST /api/v1/customer/withdrawals/request`: 출금 요청
- `GET /api/v1/customer/transactions`: 거래 내역 조회

#### 가맹점

- `POST /api/v1/merchant/virtual-accounts`: 사용자를 위한 가상계좌 등록
- `GET /api/v1/merchant/transactions/:moid`: 거래 검색

#### 웹훅

- `POST /api/v1/webhooks/ezpg/deposit-notification`: 입금 알림 처리
- `POST /api/v1/webhooks/ezpg/withdrawal-notification`: 출금 알림 처리

## 테스트

프로젝트는 포괄적인 테스트 커버리지를 포함합니다:

### 단위 테스트
- 컨트롤러와 서비스는 격리된 환경에서 테스트
- 외부 의존성에 대한 모의 구현
- `yarn test`로 실행

### 통합 테스트
- Prisma를 사용한 데이터베이스 상호작용 테스트
- 트랜잭션 처리 및 롤백
- `yarn test:integration`으로 실행

### E2E 테스트
- 전체 API 엔드포인트 테스트
- 웹훅 처리 검증
- `yarn test:e2e`로 실행

## EZPG 통합

### 입금 흐름

1. 가상계좌가 고객에게 할당됨
2. 고객이 가상계좌로 자금을 입금
3. EZPG가 웹훅으로 입금 알림을 전송
4. 시스템이 고객의 포인트 잔액을 업데이트

### 출금 흐름

1. 고객이 은행 정보와 함께 출금 요청
2. 포인트가 차감되고 EZPG로 출금 요청이 전송
3. EZPG가 은행 이체를 처리
4. EZPG가 출금 완료 알림을 전송
5. 시스템이 거래 상태를 업데이트

## 새 애플리케이션 추가

모노레포에 새 애플리케이션을 추가하려면:

1. `apps/` 아래에 새 디렉토리 생성
2. 적절한 package.json으로 애플리케이션 초기화
3. turbo.json 파이프라인에서 애플리케이션 구성

공유 패키지를 추가하려면:

1. `packages/` 아래에 새 디렉토리 생성
2. 적절한 package.json으로 패키지 초기화
3. 필요한 애플리케이션의 의존성으로 추가

## 라이선스

이 프로젝트는 독점적이며 기밀입니다. 
