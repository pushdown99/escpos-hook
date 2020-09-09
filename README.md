---
title: 전자영수증 
author: haeyeon.hwang
tags: [eReceipt, POS, ESC/P, iot]
---

# 전자영수증 (eReceipt)
---
1. [가상시리얼](#가상시리얼)
2. [POS](#pos-windows) 
3. [서버](#서버-ubuntu)

---

## 가상시리얼

~~~console

+--------+      +--------+      +--------+      +--------+      +--------+   
|  POS   | ---> |  COM3  | ---> |  COM2  | ---> |  COM1  | ---> | PRINT  |
+--------+      +--------+      +--------+      +--------+      +--------+
                     |               |
                +-------------------------+
                | VIRTUAL SERIAL PORT DRV |                     +--------+
                | ======================= | <-----------------> | SERVER | 
                | - vspd, com0com         |                     +--------+
                +-------------------------+

~~~

- [com0com](http://com0com.sourceforge.net/)
- [vspd](https://www.eltima.com/vspd-post-download.html)

---

## POS (Windows)

---

## 서버 (Ubuntu)

---