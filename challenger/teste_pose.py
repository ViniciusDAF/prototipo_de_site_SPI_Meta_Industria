from ultralytics import YOLO
import cv2

print("Carregando o modelo de Pose Estimation...")
modelo_pose = YOLO("yolov8n-pose.pt")

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
cv2.namedWindow("Monitoramento Ergonomico", cv2.WINDOW_NORMAL)
cv2.resizeWindow("Monitoramento Ergonomico", 1280, 720)
cv2.setWindowProperty("Monitoramento Ergonomico", cv2.WND_PROP_TOPMOST, 1)

while True:
    sucesso, frame = cap.read()
    if not sucesso:
        break

    altura_tela, largura_tela, _ = frame.shape
    zona_y1 = int(altura_tela * 0.7)
    zona_y2 = altura_tela
    zona_x1 = 0
    zona_x2 = largura_tela

    resultados = modelo_pose(frame, conf=0.5)
    frame_processado = resultados[0].plot()

    cv2.rectangle(frame_processado, (zona_x1, zona_y1), (zona_x2, zona_y2), (0, 0, 255), 2)
    cv2.putText(frame_processado, "ZONA CRITICA (ESTEIRA)", (10, zona_y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    status_geral = "POSTURA OK"
    cor_status = (0, 255, 0)

    if resultados[0].keypoints is not None:
        pontos = resultados[0].keypoints.xy.cpu().numpy()

        if len(pontos) > 0:
            pessoa = pontos[0]

            # Pegando os pontos dos DOIS LADOS do corpo
            nariz = pessoa[0]
            ombro_esq = pessoa[5]
            ombro_dir = pessoa[6]
            pulso_esq = pessoa[9]
            pulso_dir = pessoa[10]
            quadril_esq = pessoa[11]
            quadril_dir = pessoa[12]

            # --- REGRA 1: POSTURA INADEQUADA (360 GRAUS) ---
            # Só calcula se a câmera estiver enxergando o seu tronco completo
            if ombro_esq[0] > 0 and ombro_dir[0] > 0 and quadril_esq[0] > 0:

                # 1. Calcula os "Centros Virtuais" do corpo
                centro_ombros_x = (ombro_esq[0] + ombro_dir[0]) / 2
                centro_ombros_y = (ombro_esq[1] + ombro_dir[1]) / 2
                centro_quadril_x = (quadril_esq[0] + quadril_dir[0]) / 2

                # 2. Testes de Falha Ergonômica:
                # Falha A: Inclinação do tronco para os lados
                desvio_coluna = abs(centro_ombros_x - centro_quadril_x)

                # Falha B: Um ombro mais alto que o outro (encurvamento)
                desnivel_ombros = abs(ombro_esq[1] - ombro_dir[1])

                # Falha C: Corcunda / Cabeça afundada nos ombros
                distancia_pescoco = abs(centro_ombros_y - nariz[1]) if nariz[1] > 0 else 100

                # Se qualquer um dos limites for ultrapassado, aciona o alerta
                if desvio_coluna > 60 or desnivel_ombros > 40 or distancia_pescoco < 35:
                    status_geral = "POSTURA INADEQUADA"
                    cor_status = (0, 255, 255)  # Amarelo

                    # Desenha a "Coluna Virtual" na tela para mostrar o erro visualmente
                    cv2.line(frame_processado, (int(centro_ombros_x), int(centro_ombros_y)),
                             (int(centro_quadril_x), int((quadril_esq[1] + quadril_dir[1]) / 2)),
                             (0, 255, 255), 6)

            # --- REGRA 2: APROXIMAÇÃO DE ZONA CRÍTICA ---
            # O "!= 0" garante que ele não dê alarme falso se a mão sumir da tela
            if (pulso_esq[1] > zona_y1 and pulso_esq[1] != 0) or (pulso_dir[1] > zona_y1 and pulso_dir[1] != 0):
                status_geral = "ALERTA: MAO NA ZONA CRITICA"
                cor_status = (0, 165, 255)

            # --- REGRA 3: RISCO IMEDIATO ---
            if nariz[1] > zona_y1 and nariz[1] != 0:
                status_geral = "RISCO IMEDIATO: ROSTO NA ESTEIRA!"
                cor_status = (0, 0, 255)

    cv2.putText(frame_processado, status_geral, (30, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, cor_status, 4)
    cv2.imshow("Monitoramento Ergonomico", frame_processado)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()