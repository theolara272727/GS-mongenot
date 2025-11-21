document.addEventListener('DOMContentLoaded', function() {
    //Lógica de abas 
    const terminal = document.getElementById('terminal');

    function printToTerminal(text) {
        const newLine = document.createElement('div');
        newLine.classList.add('terminal-line');
        newLine.textContent = `> ${text}`; 
        
        terminal.appendChild(newLine);
        

        terminal.scrollTop = terminal.scrollHeight;
    }


    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(button => { button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabPanels.forEach(panel => panel.classList.remove("active"));

            button.classList.add("active");
            
            const targetTabId = button.getAttribute("data-tab");
            const targetPanel = document.getElementById(targetTabId);
            
            targetPanel.classList.add("active");
        });
    });



    // Cria o botão de Screenshot
    document.getElementById('screenshotButton').addEventListener('click', function() {
        // Selecione o corpo da página
        var body = document.body;

        // Espera pela próxima renderização antes de tirar a captura de tela
        renderer.render(scene, camera);
    
        // Use a biblioteca html2canvas para capturar a área e renderizar o screenshot
        html2canvas(body).then(function(canvas) {
            // Crie um link para download da imagem
            var link = document.createElement('a');
            link.href = canvas.toDataURL();
            link.download = 'screenshot.png';
            // Simule um clique no link para iniciar o download
            link.click();
        })
    });

    document.getElementById('sendCommandButton').addEventListener('click', function() {
        var command = document.getElementById('commandInput').value;
        printToTerminal("Comando '" + command + "' enviado com sucesso!")
        fetch('/sendCommand', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command: command })
        })
        // Apagar o conteúdo do campo de entrada após o envio
        commandInput.value = '';
    });

    //Cria as varáveis usadas no programa
    ///Variáveis para armazenar dados
    
    
    vartipos_dados = [
    'temperatura1', 'temperatura2', 'temperatura3', 'temperatura4',
    'temperatura5', 'temperatura6', 'girometroZ','azimute', 'tensao_bateria',
    'corrente_bateria', 'corrente_painelSolar1', 'corrente_painelSolar2',
    'corrente_painelSolar3', 'corrente_painelSolar4',
    ]
    dicDados = vartipos_dados.reduce((acc,chave) =>{
        acc[chave] = [];
        return acc;
    },{});

    ///Variáveis para determinar um máximo de pontos possíveis nos gráficos
    var maximoPontos = 50;
    const valorMinimo = 0;
    
    var graficoTemperatura1,graficoTemperatura2,graficoTemperatura3,graficoTemperatura4,graficoTemperatura5,graficoTemperatura6;
    var graficoCorrenteBateria,graficoCorrentePainelSolar1,graficoCorrentePainelSolar2,graficoCorrentePainelSolar3,graficoCorrentePainelSolar4;
    var graficoTensaoPainelSolar1,graficoTensaoPainelSolar2,graficoTensaoPainelSolar3,graficoTensaoPainelSolar4;
    var graficoAzimute,graficoGirometroZ;
    
    //Desenha os gráficos
    //Ciclagem Térmica
    graficoTemperatura1 = desenhaGrafico('graficoTemperatura1', 'Temperatura Heater(°C)', 'red');
    graficoTemperatura2 = desenhaGrafico('graficoTemperatura2', 'Temperatura Heater(°C)', 'red');
    graficoTemperatura3 = desenhaGrafico('graficoTemperatura3', 'Temperatura Bateria(°C)', 'red');
    graficoTemperatura4 = desenhaGrafico('graficoTemperatura4', 'Temperatura Bateria(°C)', 'red');
    graficoTemperatura5 = desenhaGrafico('graficoTemperatura5', 'Temperatura Externo(°C)', 'red');
    graficoTemperatura6 = desenhaGrafico('graficoTemperatura6', 'Temperatura Externo(°C)', 'red');
    
    //Condicionamento da Bateria
    graficoCorrenteBateria = desenhaGrafico('graficoCorrenteBateria', 'Corrente Bateria', 'blue');
    graficoCorrentePainelSolar1 = desenhaGrafico('graficoCorrentePainelSolar1', 'Corrente Painel Solar 1', 'blue');
    graficoCorrentePainelSolar2 = desenhaGrafico('graficoCorrentePainelSolar2', 'Corrente Painel Solar 2', 'blue');
    graficoCorrentePainelSolar3 = desenhaGrafico('graficoCorrentePainelSolar3', 'Corrente Painel Solar 3', 'blue');
    graficoCorrentePainelSolar4 = desenhaGrafico('graficoCorrentePainelSolar4', 'Corrente Painel Solar 4', 'blue');


    //Determinacao de atitude
    graficoGirometroZ = desenhaGrafico('graficoGirometroZ', 'Giromtero Z', 'purple');
    graficoAzimute = desenhaGrafico('graficoAzimute', 'Azimute', 'purple');

    ///Variáveis para montar os mostradores
    modo_atual = '0';
    dicGraficos = {
    // Temperaturas
    'temperatura1': graficoTemperatura1,
    'temperatura2': graficoTemperatura2,
    'temperatura3': graficoTemperatura3,
    'temperatura4': graficoTemperatura4,
    'temperatura5': graficoTemperatura5,
    'temperatura6': graficoTemperatura6,
    
    // Atitude
    'girometroZ': graficoGirometroZ,
    'azimute': graficoAzimute,
    
    // Bateria e Correntes
    'corrente_bateria': graficoCorrenteBateria,
    'corrente_painelSolar1': graficoCorrentePainelSolar1,
    'corrente_painelSolar2': graficoCorrentePainelSolar2,
    'corrente_painelSolar3': graficoCorrentePainelSolar3,
    'corrente_painelSolar4': graficoCorrentePainelSolar4,
    'tensao_painelSolar1': graficoTensaoPainelSolar1,
    'tensao_painelSolar2': graficoTensaoPainelSolar2,
    'tensao_painelSolar3': graficoTensaoPainelSolar3,
    'tensao_painelSolar4': graficoTensaoPainelSolar4,
        
    };
    telemetria_por_modo = {
    '0' : [],
    'COM' : [],
    'IV' : [],
    'ANT' : [],
    'EST' : [],
    'M1' : [],
    'M2' : [],
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
    
    "DET": [
        "tensao_painelSolar1", 
        "tensao_painelSolar2", 
        "tensao_painelSolar3", 
        "tensao_painelSolar4", 
        "girometroZ", 
        "azimute"
    ],
    
    "CA1": [
        "tensao_painelSolar1", 
        "tensao_painelSolar2", 
        "tensao_painelSolar3", 
        "tensao_painelSolar4", 
        "girometroZ", 
        "azimute"
    ],
    
    "CA2": [
        "tensao_painelSolar1", 
        "tensao_painelSolar2", 
        "tensao_painelSolar3", 
        "tensao_painelSolar4", 
        "girometroZ", 
        "azimute"
    ]
    }   
    var valor_tensao_bateria = document.getElementById('Tensao_Bateria');

    //Função para atualizar o gráfico de temperatura da bateria
    function atualizarGrafico(grafico, dados) {
        console.log('Updating charts...');
        console.log(grafico);
        ///Atualiza o gráfico de temperatura da bateria
        grafico.data.labels = Array.from({length: dados.length},(_, i) => (valorMinimo + i).toString());
        grafico.data.datasets[0].data = dados;
        grafico.update();

    }

    // Função padrão para gerar os gráficos
    function desenhaGrafico(element, label, color) {

        //Cria gráfico para temperatura da bateria
        return new Chart(document.getElementById(element).getContext('2d'),{
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: label,
                    data: [],
                    borderColor: color,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'linear',
                        display: true,
                        position: 'bottom'
                    },
                    y: {
                        beginAtZero: true
                    }
                },
                elements: {
                    line: {
                        tension: 0
                    }
                },
                animation: {
                    duration: 0
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false
                },
                maintainAspectRatio: false
            }
        })
    }

    // Funçao para atualizar a bateria
    function atualizaBateria() {
        ///Faz a requisição dos dados
        fetch('/sensorData')
        .then(response => response.json())
        .then(data => {
        var tensao_bateria = data.tensao_bateria;

        let Tensao_Maxima = 8.2;   // Substitua isso pela sua tensão máxima real
        let Tensao_Minima = 5.5;   // Substitua isso pela sua tensão mínima real

        // Calcule a porcentagem da bateria com base na fórmula inversa
        let battery_level = ((tensao_bateria - Tensao_Minima) / (Tensao_Maxima - Tensao_Minima)) * 100;

        // Certifique-se de que a porcentagem esteja dentro do intervalo de 0 a 100
        battery_level = Math.max(0, Math.min(100, battery_level));

        // Chama a função que cria a bateria
        criarInterfaceBateria(Math.round(battery_level)); 
        })
        .catch(error => console.log(error));
    }
    let lastText = ``

    function fetchTerminalData(){
        fetch('/terminalData')
            .then(response => {
                return response.text(); 
            })
            .then(terminalMessage => {
                if(terminalMessage != lastText){
                    lastText = terminalMessage;
                    printToTerminal(lastText);
                }
            
            }
            )
            .catch(error => console.log(error));

    }

    //Função para fazer a requisição dos dados ao servidor Flask
    function fetchSensorData() {
        // Faz a requisição dos dados
        fetch('/sensorData')
            .then(response => {
                if (!response.ok) {
                    console.error('Erro na requisição dos dados do sensor');
                    // Retornar uma estrutura de dados indicando um problema
                    return { error: 'Erro na requisição dos dados do sensor'};
                }
                return response.json();
            })
            .then(data => {
                // Defina uma função para verificar se um dado está presente
                if (data.error) {
                    console.warn(data.error);
                    return; // Para a execução da função aqui e aguarda a próxima chamada
                }

                const isDataPresent = (sensorData, sensorName) => {
                    if (sensorData && sensorData[sensorName] !== undefined) {
                        return true;
                    } else {
                        console.log(sensorData[sensorName] + ", " + sensorName);
                        console.error(`Dados do sensor de ${sensorName} incompletos ou ausentes.`);
                        return false;
                    }
                };
                
                const createGraphics = (sensorData,key) =>{
                    if (isDataPresent(sensorData, key )){
                        var data_point = data[key];
                        dicDados[key].push(data_point);
                        if(dicDados[key].length > maximoPontos){
                            dicDados[key].shift();
                        }
                        atualizarGrafico(dicGraficos[key], dicDados[key]);
                    }
                }
                dadosSensor = data;
                modo_atual = data['modo'];
                dadosSensor = data;
                delete dadosSensor['modo'];
                delete dadosSensor['tensao_bateria'];
                chavesDoSensor = Object.keys(dadosSensor);
                dadosDoModoAtual = telemetria_por_modo[modo_atual];
                for (const key of chavesDoSensor) {
                    if(dadosDoModoAtual.includes(key)){
                        createGraphics(data, key);
                    }
                }
                // Tensão Bateria
                if (isDataPresent(data, 'tensao_bateria')) {
                    var tensao_bateria = data.tensao_bateria;
                    valor_tensao_bateria.textContent = tensao_bateria.toFixed(2);
                    atualizaBateria();
                } 
                })
                
            .catch(error => console.log(error));
    }    



    
    function resetarGrafico(grafico) {
        // Limpa os dados do gráfico
        grafico.data.labels = [];
        grafico.data.datasets[0].data = [];
        grafico.update();
        
    }
    
    document.getElementById('resetButton').addEventListener('click', function() {
        // Limpa os dados dos gráficos ou recria os gráficos conforme necessário
        resetarGrafico(graficoTemperatura1);
        resetarGrafico(graficoTemperatura2);
        resetarGrafico(graficoTemperatura3);
        resetarGrafico(graficoTemperatura4);
        resetarGrafico(graficoTemperatura5);
        resetarGrafico(graficoTemperatura6);
        resetarGrafico(graficoAtitude);
        resetarGrafico(graficoCorrenteBateria);
        resetarGrafico(graficoCorrentePainelSolar1);
        resetarGrafico(graficoCorrentePainelSolar2);
        resetarGrafico(graficoCorrentePainelSolar3);
        resetarGrafico(graficoCorrentePainelSolar4);





        // Reinicializa as listas de dados
        for (i in dicDados){
            i.clear();
        }
    });

    //Cria mostrador da bateria
    const batteryPercentage = document.getElementById('batteryPercentage');
    const batteryCanvas = document.getElementById('batteryCanvas');
    const ctx = batteryCanvas.getContext('2d');

    function criarInterfaceBateria(battery_level) {

        let cor;
        // Cores dos retângulos
        const listaDeRetangulos = Array.from({ length: 100 }, (_, i) => `ret_${i + 1}`);
        // Cor do contorno
        const listaDeBordas = Array.from({ length: 100 }, (_, i) => `borda_${i + 1}`);

        // Lógica para definir as cores com base no nível da bateria
        if (battery_level >= 66) {
            cor = 'green';
        } else if (battery_level > 34 && battery_level <= 65) {
            cor = '#ffd968';
        } else {
            cor = 'red';
        }
        for (let i = 0; i < battery_level ; i++) {
            listaDeRetangulos[i] = cor;
            listaDeBordas[i] = cor;
        }
        for (let i = battery_level; i < listaDeRetangulos.length; i++) {
            listaDeRetangulos[i] = 'white';
            listaDeBordas[i] = 'white'; // ou listaDeBordas[i] = cor; se quiser os retãngulos com bordas coloridas
        }

        // Atualiza a porcentagem
        batteryPercentage.textContent =  Math.round(battery_level);

        // Limpa o canvas
        ctx.clearRect(0, 0, batteryCanvas.width, batteryCanvas.height);

        // Função auxiliar para desenhar retângulo com contorno
        function drawRectWithOutline(x, y, width, height, fill, outline) {
            ctx.fillStyle = fill;
            ctx.fillRect(x, y, width, height);

            // Adiciona um contorno ao retângulo
            ctx.strokeStyle = outline;
            ctx.strokeRect(x, y, width, height);
        }

            // Chama a função para cada retângulo
            let inicio = 0;
            let final = 5;

        for(let i = 0; i < listaDeRetangulos.length; i++){
            drawRectWithOutline(inicio, 0, final, 100, listaDeRetangulos[i], listaDeBordas[i])
            inicio += 5;
            final += 5;
        }
    } 



    fetchSensorData();
    fetchTerminalData();
    //Define pausa entre as chamadas da função
    setInterval(fetchSensorData, 1000);
    setInterval(fetchTerminalData, 1000);
});
