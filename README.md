---
title: 전자영수증 
author: haeyeon.hwang
tags: [eReceipt, POS, ESC/P, iot]
---

# 전자영수증 (eReceipt)
---

1. [서비스 아키텍처](#서비스-아키텍처) 
2. [가상시리얼](#가상시리얼) 
3. [POS](#pos-windows) 
4. [서버](#서버-ubuntu) 

---

## 서비스 아키텍처

~~~console

            virtual serial
            port driver
            - com0com, vspd
+-----+     +------+------+     +------+     +------+
| POS | --- | COM3 | COM2 |     | COM1 | --- | PRNT |
+-----+     +------+------+     +------+     +------+
                       |            |
+-----+            +------+         |        +------+
| QR  | ---------- | ESCP | --------+        | ESCP |
| -R  |            | -POS | ---------------- | -SVR |
+-----+            +------+                  +------+

~~~

구분|설명|비고
--|--|--
VSPD|가상 시리얼 포트 드라이버|
QR-R|QR 코드 리더기 (가입자식별)|
ESCP-POS|ESC/P 명령어 중개 모듈|
ESCP-SVR|ESC/P 명령어 처리 서버 모듈|


## 가상시리얼

#### 가상시리얼 포트 드라이버 설정 화면 (예: vspd)
![](images/vspd.png)

#### 가상시리얼 포트 드라이버 다운로드
- [com0com](http://com0com.sourceforge.net/)
- [vspd](https://www.eltima.com/vspd-post-download.html)

---

## POS (Windows)

~~~console
             
+------+     +------+     +------+
| COM2 | --- | ESPC | --- | COM1 |
+------+     +------+     +------+ 

POS print-out (com2 -> com1)
+------+     +------+     +------+
| COM2 | --> | ESPC | --> | COM1 |
+------+     +------+     +------+ 

PRINTER audit (com1 -> com2)
+------+     +------+     +------+
| COM2 | <-- | ESPC | <-- | COM1 |
+------+     +------+     +------+ 


~~~

~~~go

func main() {
	var wait sync.WaitGroup
	wait.Add(2)

	in := Open(IN)
	out := Open(OUT)

	// bi-direction communication.
	go Run(in, out)
	go Run(out, in)
	wait.Wait()
}

~~~

---

## 서버 (Ubuntu)

---