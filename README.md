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

+------+      +------+      +------+      +------+      +---------+   
| POS  | ---> | COM3 | ---> | COM2 | ---> | COM1 | ---> | PRINTER |
+------+      +------+      +------+      +------+      +---------+
                 |              |
              +--------------------+
              | VIRTUAL SERIAL DRV |                    +---------+
              | ===================| <----------------> | SERVER  | 
              | - vspd, com0com    |                    +---------+
              +--------------------+

~~~

![](images/vspd.png)

- [com0com](http://com0com.sourceforge.net/)
- [vspd](https://www.eltima.com/vspd-post-download.html)

---

## POS (Windows)

~~~go
package main

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"sync"
	"time"

	"github.com/jacobsa/go-serial/serial"
)

const IN = "COM2"
const OUT = "COM1"
const URL = "http://debian.tric.kr:9901"

type JsonData struct {
	Data      string
	Timestamp int64
}

func Open(device string) io.ReadWriteCloser {
	options := serial.OpenOptions{
		PortName:        device,
		BaudRate:        19200,
		DataBits:        8,
		StopBits:        1,
		MinimumReadSize: 4,
	}
	port, err := serial.Open(options)
	if err != nil {
		fmt.Println("serial.Open: %v", err)
	}
	return port
}

func Run(in io.ReadWriteCloser, out io.ReadWriteCloser) {
	for {
		buf := make([]byte, 4096)
		n, err := in.Read(buf)

		if err != nil {
			if err != io.EOF {
				fmt.Println("Error reading from serial port: ", err)
			}
		} else {
			buf = buf[:n]
			if n > 0 {
				d := JsonData{Data: hex.EncodeToString(buf), Timestamp: time.Now().Unix()}
				b, _ := json.Marshal(d)
				resp, err := http.Post("http://debian.tric.kr:9901", "application/json", bytes.NewBuffer(b))
				if err != nil {
					fmt.Println("Error: ", err)
				} else {
					defer resp.Body.Close()
					if resp.StatusCode == http.StatusOK {
						s, err := ioutil.ReadAll(resp.Body)
						if err == nil {
							b, _ = hex.DecodeString(string(s))
							out.Write(b)
						} else {
							fmt.Println("Error: ", err)
						}
					}
				}
			}
		}
	}
}

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