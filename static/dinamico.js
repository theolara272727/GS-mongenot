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

    mensagens_teste = ["ADS ligado","EPS ligado","Carregando bateria...","Modo 1 ativado","Modo 2 ativado","Modo 3 ativado",
        "Testando sensores...","Sensores ativos!","Testando corrente...","Sistemas nominais!","Ativando paineis solares","Desativando paineis solares",
        "AAAAA","BBBB","CCCCC","DDDD","EEEEEE","FFFFFF","GGGGGG","HHHHHHH","IIIIIII","JJJJJJJ","KKKKKK"
    ];
    for(i in mensagens_teste){
        printToTerminal(mensagens_teste[i]);
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
    var dado_temperatura1 = [];
    var dado_temperatura2 = [];
    var dado_temperatura3 = [];
    var dado_temperatura4 = [];
    var dado_temperatura5 = [];
    var dado_temperatura6 = [];
    var dado_atitude = [];
    var dado_corrente_bateria = [];
    var dado_corrente_painelSolar1 = [];
    var dado_corrente_painelSolar2 = [];
    var dado_corrente_painelSolar3 = [];
    var dado_corrente_painelSolar4 = [];
    
    vartipos_dados = [
    'temperatura1', 'temperatura2', 'temperatura3', 'temperatura4',
    'temperatura5', 'temperatura6', 'atitude', 'tensao_bateria',
    'corrente_bateria', 'corrente_painelSolar1', 'corrente_painelSolar2',
    'corrente_painelSolar3', 'corrente_painelSolar4',
    ]

    ///Variáveis para determinar um máximo de pontos possíveis nos gráficos
    var maximoPontos = 50;
    const valorMinimo = 0;

    ///Variáveis para montar os mostradores
    var valor_tensao_bateria = document.getElementById('Tensao_Bateria');

    //Função para atualizar o gráfico de temperatura da bateria
    function atualizarGrafico(grafico, dados) {
        console.log('Updating charts...');
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




                // Temperatura 1
                if (isDataPresent(data, 'temperatura1')) {
                    var temperatura1 = data.temperatura1;
                    dado_temperatura1.push(temperatura1);
                    if (dado_temperatura1.length > maximoPontos) {
                        dado_temperatura1.shift();
                    }
                    atualizarGrafico(graficoTemperatura1, dado_temperatura1);
                }

                // Temperatura 2
                if (isDataPresent(data, 'temperatura2')) {
                    var temperatura2 = data.temperatura2;
                    dado_temperatura2.push(temperatura2);
                    if (dado_temperatura2.length > maximoPontos) {
                        dado_temperatura2.shift();
                    }
                    atualizarGrafico(graficoTemperatura2, dado_temperatura2);
                }

                // Temperatura 3
                if (isDataPresent(data, 'temperatura3')) {
                    var temperatura3 = data.temperatura3;
                    dado_temperatura3.push(temperatura3);
                    if (dado_temperatura3.length > maximoPontos) {
                        dado_temperatura3.shift();
                    }
                    atualizarGrafico(graficoTemperatura3, dado_temperatura3);
                }

                // Temperatura 4
                if (isDataPresent(data, 'temperatura4')) {
                    var temperatura4 = data.temperatura4;
                    dado_temperatura4.push(temperatura4);
                    if (dado_temperatura4.length > maximoPontos) {
                        dado_temperatura4.shift();
                    }
                    atualizarGrafico(graficoTemperatura4, dado_temperatura4);
                }

                // Temperatura 5
                if (isDataPresent(data, 'temperatura5')) {
                    var temperatura5 = data.temperatura5;
                    dado_temperatura5.push(temperatura5);
                    if (dado_temperatura5.length > maximoPontos) {
                        dado_temperatura5.shift();
                    }
                    atualizarGrafico(graficoTemperatura5, dado_temperatura5);
                }

                // Temperatura 6
                if (isDataPresent(data, 'temperatura6')) {
                    var temperatura6 = data.temperatura6;
                    dado_temperatura6.push(temperatura6);
                    if (dado_temperatura6.length > maximoPontos) {
                        dado_temperatura6.shift();
                    }
                    atualizarGrafico(graficoTemperatura6, dado_temperatura6);
                }

                // Atitude
                if (isDataPresent(data, 'atitude')) {
                    var atitude = data.atitude;
                    dado_atitude.push(atitude);
                    if (dado_atitude.length > maximoPontos) {
                        dado_atitude.shift();
                    }
                    atualizarGrafico(graficoAtitude, dado_atitude);
                }

                // Corrente Bateria
                if (isDataPresent(data, 'corrente_bateria')) {
                    var corrente_bateria = data.corrente_bateria;
                    dado_corrente_bateria.push(corrente_bateria);
                    if (dado_corrente_bateria.length > maximoPontos) {
                        dado_corrente_bateria.shift();
                    }
                    atualizarGrafico(graficoCorrenteBateria, dado_corrente_bateria);
                }

                // Corrente Painel Solar 1
                if (isDataPresent(data, 'corrente_painelSolar1')) {
                    var corrente_painelSolar1 = data.corrente_painelSolar1;
                    dado_corrente_painelSolar1.push(corrente_painelSolar1);
                    if (dado_corrente_painelSolar1.length > maximoPontos) {
                        dado_corrente_painelSolar1.shift();
                    }
                    atualizarGrafico(graficoCorrentePainelSolar1, dado_corrente_painelSolar1);
                }

                // Corrente Painel Solar 2
                if (isDataPresent(data, 'corrente_painelSolar2')) {
                    var corrente_painelSolar2 = data.corrente_painelSolar2;
                    dado_corrente_painelSolar2.push(corrente_painelSolar2);
                    if (dado_corrente_painelSolar2.length > maximoPontos) {
                        dado_corrente_painelSolar2.shift();
                    }
                    atualizarGrafico(graficoCorrentePainelSolar2, dado_corrente_painelSolar2);
                }

                // Corrente Painel Solar 3
                if (isDataPresent(data, 'corrente_painelSolar3')) {
                    var corrente_painelSolar3 = data.corrente_painelSolar3;
                    dado_corrente_painelSolar3.push(corrente_painelSolar3);
                    if (dado_corrente_painelSolar3.length > maximoPontos) {
                        dado_corrente_painelSolar3.shift();
                    }
                    atualizarGrafico(graficoCorrentePainelSolar3, dado_corrente_painelSolar3);
                }

                // Corrente Painel Solar 4
                if (isDataPresent(data, 'corrente_painelSolar4')) {
                    var corrente_painelSolar4 = data.corrente_painelSolar4;
                    dado_corrente_painelSolar4.push(corrente_painelSolar4);
                  if (dado_corrente_painelSolar4.length > maximoPontos) {
                        dado_corrente_painelSolar4.shift();
                    }
                    atualizarGrafico(graficoCorrentePainelSolar4, dado_corrente_painelSolar4);
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


    var graficoTemperatura1,graficoTemperatura2,graficoTemperatura3,graficoTemperatura4,graficoTemperatura5,graficoTemperatura6;
    var graficoCorrenteBateria,graficoCorrentePainelSolar1,graficoCorrentePainelSolar2,graficoCorrentePainelSolar3,graficoCorrentePainelSolar4;
    var graficoAtitude;
    
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
    graficoCorrentePainelSolar2 = desenhaGrafico('graficoCorrentePainelSolar2', 'Corrente Painel Solar', 'blue');
    graficoCorrentePainelSolar3 = desenhaGrafico('graficoCorrentePainelSolar3', 'Corrente Painel Solar', 'blue');
    graficoCorrentePainelSolar4 = desenhaGrafico('graficoCorrentePainelSolar4', 'Corrente Painel Solar', 'blue');


    //Determinacao de atitude
    graficoAtitude = desenhaGrafico('graficoAtitude', 'Atitude', 'purple');

    
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
        dado_temperatura1 = [];
        dado_temperatura2 = [];
        dado_temperatura3 = [];
        dado_temperatura4 = [];
        dado_temperatura5 = [];
        dado_temperatura6 = [];
        dado_atitude = [];
        dado_corrente_bateria = [];
        dado_corrente_painelSolar1 = [];
        dado_corrente_painelSolar2 = [];
        dado_corrente_painelSolar3 = [];
        dado_corrente_painelSolar4 = [];

    });

    //Cria mostrador da bateria
    const batteryPercentage = document.getElementById('batteryPercentage');
    const batteryCanvas = document.getElementById('batteryCanvas');
    const ctx = batteryCanvas.getContext('2d');

    function criarInterfaceBateria(battery_level) {

        let cor;
        // Cores dos retângulos
        const listaDeRetangulos = Array.from({ length: 100 }, (_, i) => `ret_${i + 1}`);
        console.log(listaDeRetangulos);
        // Cor do contorno
        const listaDeBordas = Array.from({ length: 100 }, (_, i) => `borda_${i + 1}`);
        console.log(listaDeBordas);

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
