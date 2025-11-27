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
modo_atual = '0'
# 0 - inicialziacao temperatura_1 até temperatura_6; corrente bateria; tensao bateria;
# COM - teste de comunicacao - terminal
# CT - Controle termico temperatura_1 até temperatura_6; corrente bateria; tensao bateria;
# IV - Teste pos vibracao - terminal
# ANT - Abertura antena - terminal
# CB - Controle de bateria tensao_painel_solar1; tensao_painel_solar2; tensao_painel_solar3; tensao_painel_solar4; corrente_painel_solar1; corrente_painel_solar2; corrente_painel_solar3; corrente_painel_solar4; tensao de bateria; corrente bateria
# EST - estabilidade -terminal 
# DET - determinacao  tensao_painel_solar1; tensao_painel_solar2; tensao_painel_solar3; tensao_painel_solar4; girometro_z; azimute
# CA1 - Controle atitude 1: tensao_painel_solar1; tensao_painel_solar2; tensao_painel_solar3; tensao_painel_solar4; girometro_z; azimute
# CA2 - controle atitude 2: tensao_painel_solar1; tensao_painel_solar2; tensao_painel_solar3; tensao_painel_solar4; girometro_z; azimute
# M1 - missao 1 - terminal
# M2 - missao 2 - terminal
modos = ['0','COM','CT','IV','ANT','CB','EST','DET','CA1','CA2','M1','M2']

tipos_dados = [
    'temperatura1', 'temperatura2', 'temperatura3', 'temperatura4',
    'temperatura5', 'temperatura6', 'girometroZ','azimute', 'tensao_bateria',
    'corrente_bateria', 'corrente_painelSolar1', 'tensao_painelSolar1', 'corrente_painelSolar2', 'tensao_painelSolar2',
    'corrente_painelSolar3', 'tensao_painelSolar3','corrente_painelSolar4','tensao_painelSolar4'
]
telemetria_por_modo = {
    '0' : [],
    'COM' : [],
    'IV' : [],
    'ANT' : [],
    'EST' : [],
    'M1' : [],
    'M2' : [],
    # Controle Térmico
    "CT": [
        "temperatura1", 
        "temperatura2", 
        "temperatura3", 
        "temperatura4", 
        "temperatura5", 
        "temperatura6", 
        "corrente_bateria", 
        "tensao_bateria"
    ],
    
    # Controle de Bateria
    "CB": [
        "tensao_painelSolar1", 
        "tensao_painelSolar2", 
        "tensao_painelSolar3", 
        "tensao_painelSolar4", 
        "corrente_painelSolar1", 
        "corrente_painelSolar2", 
        "corrente_painelSolar3", 
        "corrente_painelSolar4", 
        "tensao_bateria", 
        "corrente_bateria"
    ],
    
    # Determinação de Atitude
    "DET": [
        "tensao_painelSolar1", 
        "tensao_painelSolar2", 
        "tensao_painelSolar3", 
        "tensao_painelSolar4", 
        "girometroZ", 
        "azimute"
    ],
    
    # Controle Atitude 1
    "CA1": [
        "tensao_painelSolar1", 
        "tensao_painelSolar2", 
        "tensao_painelSolar3", 
        "tensao_painelSolar4", 
        "girometroZ", 
        "azimute"
    ],
    
    # Controle Atitude 2
    "CA2": [
        "tensao_painelSolar1", 
        "tensao_painelSolar2", 
        "tensao_painelSolar3", 
        "tensao_painelSolar4", 
        "girometroZ", 
        "azimute"
    ]
}

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
    'girometroZ': 0.0,
    'tensao_bateria': 0.0,
    'corrente_bateria': 0.0,
    'corrente_painelSolar1': 0.0,
    'corrente_painelSolar2': 0.0,
    'corrente_painelSolar3': 0.0,
    'corrente_painelSolar4': 0.0,
    'tensao_painelSolar1': 0.0,
    'tensao_painelSolar2': 0.0,
    'tensao_painelSolar3': 0.0,
    'tensao_painelSolar4': 0.0,
    'azimute': 0.0,

}
tipos_dados_atual = []

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
    global modo_atual
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
                        if len(parts) >= len(tipos_dados_atual):
                            # Cria um dicionário com os novos valores para facilitar a manipulação
                            new_hk_data = {}
                            for i, key in enumerate(tipos_dados_atual):
                                    new_hk_data[key] = verifica_nulo(parts[i], ultimo_HK[key], key)
                            
                            # Atualiza os dados globais e salva no arquivo
                            ultimo_HK.update(new_hk_data)
                            dados_HK = list(ultimo_HK.values())
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

    if len(dados_HK) < len(tipos_dados_atual):
        print("Aviso: Dados incompletos. A thread de leitura pode estar se conectando ou sem dados.")
        # Retorna um erro HTTP 503 (Serviço Indisponível)
        return jsonify({"error": "Dados do sensor ainda não disponíveis ou incompletos."}), 503 
    data_to_send = dict(zip(tipos_dados,dados_HK))
    data_to_send.update({'modo':modo_atual})
    return jsonify(data_to_send)

@app.route('/sendCommand', methods=['POST'])
def send_command():
    global modo_atual
    global tipos_dados_atual
    command = request.json['command']
    if(command[:5] == "Modo_"):
        modo_atual = command[5:]
        tipos_dados_atual = telemetria_por_modo[modo_atual]
        print("Modo mudado para " + modo_atual + "\n")
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