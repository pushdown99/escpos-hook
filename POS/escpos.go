/*
 * This application can be used to experiment and test various serial port options
 */

package main

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/jacobsa/go-serial/serial"
	"encoding/json"
	"io/ioutil"
)

//////////////////////////////////////////////////////////////

type Config struct {
	Name  		string 
	Register	string
	Address		string
	POS			string
	Printer		string
    Using 		bool
}

var config = Config {
	Name: 		"Input name",
	Register: 	"Input business register number",
	Address: 	"Input address",
	POS: 		"COM1",
	Printer: 	"COM2",
	Using: 		true,
};

//////////////////////////////////////////////////////////////

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
				fmt.Println("input")
				fmt.Println(hex.Dump(buf))
				d := JsonData{Data: hex.EncodeToString(buf), Timestamp: time.Now().Unix()}
				b, _ := json.Marshal(d)
				//resp, err := http.Post("http://debian.tric.kr:9901", "application/json", bytes.NewBuffer(b))
				resp, err := http.Post("https://tric.kr/receipt/123", "application/json", bytes.NewBuffer(b))
				if err != nil {
					fmt.Println("Error: ", err)
				} else {
					defer resp.Body.Close()
					if resp.StatusCode == http.StatusOK {
						s, err := ioutil.ReadAll(resp.Body)
						if err == nil {
							b, _ = hex.DecodeString(string(s))
							fmt.Println("output")
							fmt.Println(b)
							out.Write(b)
						} else {
							fmt.Println("Error: ", err)
						}
					}
				}
			}
			//out.Write(buf)
		}
	}
}

func readConfig() {
	dat, _ := ioutil.ReadFile("test.json")
	json.Unmarshal([]byte(dat), &config)
	fmt.Println(config)
	fmt.Println(config.Name)
}

func main() {
	var wait sync.WaitGroup
	wait.Add(2)

	readConfig ()
	fmt.Println("ESC/P POS Agent Ready.")

	in := Open("COM2")
	out := Open("COM1")

	go Run(in, out)
	go Run(out, in)
	wait.Wait()
}
