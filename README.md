# Attack-Simulator v1.27

This is to simulate and demonstrate the protection of pre-defined and customized web and system attack include : 

- Web attack from container
- Web attack from curretn browser
- System script/ Kuberetes attack from container

Please make sure you installed prisma cloud defender or cortex cloud xdr agent to your runtime before test the scenarios. 

By default you can use docker image paliguoqing/attack-simulator:v1-1750402414 directly , Please read the Deployment guide -> Attack-Simulator Deployment Guide v1.27.docx

In case you want to build your own image , create that from the Dockerfile . 

APP UI is very simple :

<img width="1482" height="772" alt="image" src="https://github.com/user-attachments/assets/eca39a00-9013-41f2-bb63-f2cf269dacdd" />

<img width="1457" height="497" alt="image" src="https://github.com/user-attachments/assets/81917cd1-4e21-49f2-864e-f8034c29e10d" />

**CAUTION:**

Please be sure to use this deployment scenario only in completely isolated, non-production test clusters. Do not use this configuration in any production or critical environment!
