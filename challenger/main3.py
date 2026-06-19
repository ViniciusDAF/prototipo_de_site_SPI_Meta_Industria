from ultralytics import YOLO
import cv2
import time

print("Carregando o cérebro da Inteligência Artificial...")
modelo = YOLO("best.pt")

print("Ligando a câmera (Modo DirectShow)...")
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

# ==========================================
# VARIÁVEIS DE ESTADO (FASES DO SISTEMA)
# ==========================================
fase_atual = 1
inicio_validacao = 0
em_validacao = False

while True:
    sucesso, frame = cap.read()
    if not sucesso:
        print("A conexão com a câmera caiu.")
        break

    altura_tela, largura_tela, _ = frame.shape

    # ==========================================
    # 1. CONFIGURANDO A FASE ATUAL
    # ==========================================
    if fase_atual == 1:
        alvos = [1, 5]
        id_ok = 1
        id_falha = 5
        nome_falha = "MASCARA"
        qtd_necessaria = 1  # Precisa de 1 máscara
    elif fase_atual == 2:
        alvos = [4, 9]
        id_ok = 9
        id_falha = 4
        nome_falha = "LUVAS"
        qtd_necessaria = 2  # Precisa de 2 luvas
    else:
        alvos = []

    if fase_atual < 3:
        resultados = modelo(frame, conf=0.5, classes=alvos)

    status_texto = ""
    sub_texto = ""
    cor_texto = (255, 255, 255)

    detectou_falha = False
    caixas_ok = []
    caixas_falha = []

    # ==========================================
    # 2. LENDO OS DADOS DO YOLO
    # ==========================================
    if fase_atual < 3:
        for box in resultados[0].boxes:
            classe_id = int(box.cls[0])
            x1, y1, x2, y2 = int(box.xyxy[0][0]), int(box.xyxy[0][1]), int(box.xyxy[0][2]), int(box.xyxy[0][3])

            if classe_id == id_ok:
                caixas_ok.append((x1, y1, x2, y2))
            elif classe_id == id_falha:
                detectou_falha = True
                caixas_falha.append((x1, y1, x2, y2))

        # ==========================================
        # 3. A LÓGICA DE VALIDAÇÃO E CONTAGEM
        # ==========================================

        # CENÁRIO A: Achou um erro claro (ex: mão sem luva ou rosto sem máscara)
        if detectou_falha:
            em_validacao = False
            status_texto = "DESEQUIPADO"
            sub_texto = f"FALTANDO: {nome_falha}"
            cor_texto = (0, 0, 255)  # VERMELHO

            for (cx1, cy1, cx2, cy2) in caixas_falha:
                cv2.rectangle(frame, (cx1, cy1), (cx2, cy2), (0, 0, 255), 2)

        # CENÁRIO B: Não tem erro, vamos contar se a quantidade está certa
        else:
            qtd_encontrada = len(caixas_ok)

            # Atingiu a quantidade necessária (1 para máscara, 2 para luvas)?
            if qtd_encontrada >= qtd_necessaria:
                if not em_validacao:
                    em_validacao = True
                    inicio_validacao = time.time()

                if em_validacao:
                    tempo_decorrido = time.time() - inicio_validacao
                    tempo_restante = 5 - int(tempo_decorrido)

                    if tempo_restante > 0:
                        status_texto = "VALIDANDO..."
                        sub_texto = f"Aguarde {tempo_restante} segundos"
                        cor_texto = (0, 255, 255)  # AMARELO

                        for (cx1, cy1, cx2, cy2) in caixas_ok:
                            cv2.rectangle(frame, (cx1, cy1), (cx2, cy2), (0, 255, 255), 2)
                    else:
                        # Passou!
                        em_validacao = False
                        fase_atual += 1

            # CENÁRIO C: A quantidade está incompleta (Ex: Só 1 luva na tela)
            elif fase_atual == 2 and qtd_encontrada == 1:
                em_validacao = False
                status_texto = "INCOMPLETO"
                sub_texto = "FALTA 1 MAO NA CAMERA"
                cor_texto = (0, 165, 255)  # LARANJA (Aviso)

                # Desenha a luva encontrada em laranja para mostrar que foi vista
                for (cx1, cy1, cx2, cy2) in caixas_ok:
                    cv2.rectangle(frame, (cx1, cy1), (cx2, cy2), (0, 165, 255), 2)

            # CENÁRIO D: Tela vazia ou não achou nada
            else:
                em_validacao = False
                status_texto = "DESEQUIPADO"
                cor_texto = (0, 0, 255)  # VERMELHO

                cv2.putText(frame, f"Para validar, mostre {nome_falha} na camera", (30, 100),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                cv2.putText(frame, "e mantenha estavel por 5 segundos.", (30, 125),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

    # ==========================================
    # 4. FASE 3: ACESSO LIBERADO
    # ==========================================
    if fase_atual == 3:
        status_texto = "EQUIPADO"
        sub_texto = "ACESSO LIBERADO"
        cor_texto = (0, 255, 0)  # VERDE

    # ==========================================
    # 5. IMPRIME OS TEXTOS NA TELA
    # ==========================================
    if status_texto != "":
        cv2.putText(frame, status_texto, (30, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.5, cor_texto, 4)
        if sub_texto != "":
            cv2.putText(frame, sub_texto, (30, 110), cv2.FONT_HERSHEY_SIMPLEX, 1.0, cor_texto, 3)

    # Checklist Verde
    if fase_atual >= 2:
        posicao_y = altura_tela - 80 if fase_atual == 3 else altura_tela - 30
        cv2.putText(frame, "[OK] MASCARA", (30, posicao_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    if fase_atual == 3:
        cv2.putText(frame, "[OK] LUVAS", (30, altura_tela - 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    cv2.imshow("Verificacao de Mascara", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("Encerrando o sistema...")
        break

cap.release()
cv2.destroyAllWindows()