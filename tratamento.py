# -*- coding: utf-8 -*-
# Importa as bibliotecas necessárias para o servidor Flask, comunicação serial e threading.
from flask import Flask, request, render_template, jsonify
import serial
import threading
import math
import time

# --- Variáveis Globais ---
# Os dados coletados pela thread de leitura serão armazenados aqui.
dados_HK = []
ser = None # Variável para a porta serial
arduino_connected = False
terminalMessage = "aaa"

tipos_dados = [
    'temperatura1', 'temperatura2', 'temperatura3', 'temperatura4',
    'temperatura5', 'temperatura6', 'atitude', 'tensao_bateria',
    'corrente_bateria', 'corrente_painelSolar1', 'corrente_painelSolar2',
    'corrente_painelSolar3', 'corrente_painelSolar4',
]
num_dados = len(tipos_dados)
# Últimos valores válidos (usados para substituir dados corrompidos)
# A estrutura de dados de "últimos valores" deve ser um dicionário para fácil acesso.
ultimo_HK = {
    'temperatura1': 0.0,
    'temperatura2': 0.0,
    'temperatura3': 0.0,
    'temperatura4': 0.0,
    'temperatura5': 0.0,
    'temperatura6': 0.0,
    'atitude': 0.0,
    'tensao_bateria': 0.0,
    'corrente_bateria': 0.0,
    'corrente_painelSolar1': 0.0,
    'corrente_painelSolar2': 0.0,
    'corrente_painelSolar3': 0.0,
    'corrente_painelSolar4': 0.0,

}


# --- Funções de Ajuda ---
def verifica_nulo(valor_str, ultimo_valor_valido, nome_campo):

    try:
        valor_float = float(valor_str)
        if math.isnan(valor_float):
            print(f"[{nome_campo}]: Valor NaN detectado, usando último valor válido: {ultimo_valor_valido}")
            return ultimo_valor_valido
        else:
            return valor_float
    except (ValueError, TypeError):
        print(f"[{nome_campo}]: Erro de conversão, usando último valor válido: {ultimo_valor_valido}")
        return ultimo_valor_valido


def write_dados_HK(data_parts):
    """Salva os dados de HouseKeeping em um arquivo."""
    with open("dados/data.txt", "w") as file:
        for i in range(0,num_dados):
            line = f"{data_parts[i]} "
            file.write(line)
        file.write("\n")


# --- Funções para Escrever dados em TXT ---
def write_data():
    global ser, arduino_connected
    # Loop para tentar a conexão serial continuamente até ter sucesso
    while True:
        try:
            ser = serial.Serial('COM17', 9600) 
            print('Conexão serial estabelecida!')
            arduino_connected = True
            break
        except serial.SerialException() as e:
            print(f"Erro ao conectar à porta serial: {e}. Tentando novamente em 1 segundos...")
            time.sleep(1)
    while arduino_connected:
        try:
            data = ser.readline().decode('utf-8').strip()
            with open("dados/data.txt", "w") as file:
                file.write(data)
        except Exception as e:
            print(f"Erro inesperado {e}")
            

# --- Funções de Leitura e Processamento ---
def read_data():
    """
    Função principal que roda em uma thread para ler dados da porta serial.
    Ela tenta se conectar e, uma vez conectada, lê e processa as linhas de dados.
    """
    global dados_HK
    global ser
    global ultimo_HK
    global terminalMessage
    # Loop principal para ler dados após a conexão
    while True:
        try:
            # Lê a linha completa e decodifica para string
            with open("dados/data.txt", "r") as file:
                lines = file.readlines()
            for line in lines:
                line = line.strip()
                if line:
                    if(line[:2] == "D "):
                        # Divide a linha em partes separadas por espaço
                        parts = line.split(' ')
                        del parts[0]
                        # Processa os dados HK
                        if len(parts) == num_dados:
                            # Cria um dicionário com os novos valores para facilitar a manipulação
                            new_hk_data = {}
                            for i, key in enumerate(tipos_dados):
                                    new_hk_data[key] = verifica_nulo(parts[i], ultimo_HK[key], key)
                            
                            # Atualiza os dados globais e salva no arquivo
                            ultimo_HK.update(new_hk_data)
                            dados_HK = list(new_hk_data.values())
                    else:
                        terminalMessage = line

        except serial.SerialException:
            print("Conexão serial perdida. Tentando reconectar...")
            ser.close()
            # O loop externo tentará a reconexão
            break
        except Exception as e:
            print(f"Erro inesperado durante a leitura de dados: {e}")
            
# --- Servidor Flask e Rotas ---
app = Flask(__name__)

@app.route('/')
def index():
    """Rota para servir a página principal."""
    return render_template('index.html')

@app.route('/terminalData')
def get_terminal_data():
    global terminalMessage
    return terminalMessage

@app.route('/sensorData')
def get_sensor_data():

    global dados_HK

    print(f"Print: {dados_HK[0]}")
    if len(dados_HK) < num_dados:
        print("Aviso: Dados incompletos. A thread de leitura pode estar se conectando ou sem dados.")
        # Retorna um erro HTTP 503 (Serviço Indisponível)
        return jsonify({"error": "Dados do sensor ainda não disponíveis ou incompletos."}), 503 
    data_to_send = dict(zip(tipos_dados,dados_HK))

    return jsonify(data_to_send)

@app.route('/sendCommand', methods=['POST'])
def send_command():
    command = request.json['command']
    print("Comando: - " + command + " - enviado com sucesso!")
    ser.write(command.encode())
    return 'Comando enviado com sucesso!'



# --- Inicialização da Aplicação ---
if __name__ == '__main__':
    try:
        import os, traceback, sys
        os.makedirs("dados", exist_ok=True)

        # Inicia as threads
        arduino_thread1 = threading.Thread(target=write_data, name="WriteDataThread")
        arduino_thread2 = threading.Thread(target=read_data, name="ReadDataThread")
        arduino_thread1.daemon = True
        arduino_thread2.daemon = True
        arduino_thread1.start()
        arduino_thread2.start()

        # Roda o servidor Flask (evita reloader duplicar threads)
        app.run(debug=True, use_reloader=False)
    except Exception:
        traceback.print_exc()
        sys.exit(1)