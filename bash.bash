#!/bin/bash
echo -n VVEDI NOMER : 
read int
echo "$int" > /root/aknomber.txt
echo -n VVEDI EMAIL : 
read em 
echo "$em" >> /root/aknomber.txt
echo -n VVEDI USERa : 
read us 
echo "$us" >> /root/aknomber.txt
# ----
sudo apt-get update 
sudo apt install expect -y
# cozdadum skript avtootveta
echo -e '#!/usr/bin/expect\nspawn sudo apt-get upgrade -y \nexpect "Package configuration"'> /root/autootvet.sh
echo 'send "111\r"' >> /root/autootvet.sh
echo 'expect -re "# $"' >> /root/autootvet.sh
chmod 777 autootvet.sh
./autootvet.sh 
# ------------
sudo apt install git -y 
apt-get install -y python3 python3-pip 
sudo apt install -y libsodium-dev cmake g++ git
sleep 3
# Второй этап-----------------------------------------------
sudo apt install python3-pip
sudo apt install curl -y
sudo apt-get install screen git 
curl https://rclone.org/install.sh | sudo bash 
sudo pip3 install -r requirements.txt
sleep 2
# Третий этап -----------------------------------------------------
cd
chmod 777 trans.sh
mkdir /aws32 
screen -dmS mount rclone mount --daemon aws32: /aws32 
# Четвкртый --------------------------------------------------
cd
# Монтируем диск 1
parted /dev/nvme1n1 --script mklabel gpt mkpart xfspart xfs 0% 100%
mkfs.xfs -f /dev/nvme1n1
partprobe /dev/nvme1n1
mkdir /disk1
mount /dev/nvme1n1 /disk1
# Монтируем диск 2
parted /dev/nvme2n1 --script mklabel gpt mkpart xfspart xfs 0% 100%
mkfs.xfs -f /dev/nvme2n1
partprobe /dev/nvme2n1
mkdir /disk2
mount /dev/nvme2n1 /disk2
# Монтируем диск 3
mkdir /disk3
mount /dev/nvme2n1 /disk3
# Монтируем диск 4
parted /dev/nvme4n1 --script mklabel gpt mkpart xfspart xfs 0% 100%
mkfs.xfs -f /dev/nvme4n1
partprobe /dev/nvme4n1
mkdir /disk4
mount /dev/nvme2n1 /disk4
# Создаем дериктории на дисках
cd /disk4
mkdir osnova
cd /disk4
mkdir osnova1
cd /disk4 
mkdir beckup
cd /disk4 
mkdir beckup1
cd /disk1
mkdir vid1 
cd /disk2
mkdir vid2
cd /disk3
mkdir video1
cd /disk3
mkdir video
cd /disk4
mkdir video
cd /root
# Качаем плоттер и устанавливаем 
cd
git clone https://github.com/madMAx43v3r/chia-plotter.git 
sleep 3
cd chia-plotter
git submodule update --init
sleep 3
./make_devel.sh
sleep 5
cd
# отправка на сервер информационного файла ------------------------------
server=$(sed -n '1,1p' < aknomber.txt)
kakoi=$(sed -n '2,2p' < aknomber.txt) # .txt
kuda=$(sed -n '3,3p' < aknomber.txt)

# - deriktoriya usera
echo -e "#!/usr/bin/expect\nsleep 270\nspawn ssh -oStrictHostKeyChecking=no root@45.79.151.232" > /root/dir_user.sh
echo 'expect "password"' >> /root/dir_user.sh
echo 'send "XUVLWMX5TEGDCHDU\r"' >> /root/dir_user.sh
echo 'expect -re "# $"' >> /root/dir_user.sh
echo 'send "mkdir /root/Otchet/'$kuda'\r"' >> /root/dir_user.sh
echo 'expect -re "# $"' >> /root/dir_user.sh
chmod 777 dir_user.sh
screen -dmS puti1 ./dir_user.sh 

# - deriktoriya akka
echo -e "#!/usr/bin/expect\nsleep 270\nspawn ssh -oStrictHostKeyChecking=no root@45.79.151.232" > /root/dir_akka.sh
echo 'expect "password"' >> /root/dir_akka.sh
echo 'send "XUVLWMX5TEGDCHDU\r"' >> /root/dir_akka.sh
echo 'expect -re "# $"' >> /root/dir_akka.sh
echo 'send "mkdir /root/Otchet/'$kuda"/"$kakoi'\r"' >> /root/dir_akka.sh
echo 'expect -re "# $"' >> /root/dir_akka.sh
chmod 777 dir_akka.sh
screen -dmS puti2 ./dir_akka.sh
cd
# - Cоздаем и отправляем otpravka.sh
echo -e '#!/usr/bin/expect\nset COUNT 0\nwhile { $COUNT <= 5 } {\nspawn scp -oStrictHostKeyChecking=no '$kakoi'_'$server' root@45.79.151.232:/root/Otchet/'$kuda'/'$kakoi'/\nexpect "password"' > /root/otpravka.sh
echo 'send "XUVLWMX5TEGDCHDU\r"' >> /root/otpravka.sh
echo -e 'expect -re "# $"\nsleep 30\n}' >> /root/otpravka.sh
chmod 777 otpravka.sh
screen -dmS otpravka_na_serv ./otpravka.sh
 
./dir_akka.sh
# ЗАпуск Плотера ------------------------------
screen -dmS videorender1 ./chia-plotter/build/chia_plot -n -1 -r 12 -u 256 -t /disk1/vid1/ -2 /disk2/vid2/ -d /disk3/video/ -f b8e1d57e3e2dbb40ac8f2b257b762d05fcfc5b79c32a22255424644b7d183daa7c454624783f2d959c02eb1d2a4ba3a3 -p 91ea997633345082b15f83b957449180037030b6b7485f07ed4ee7558d08d3efbccf2c3d68ba724f5b3a8281a0055e27
screen -dmS videorender2 ./chia-plotter/build/chia_plot -n -1 -r 12 -u 256 -t /disk1/vid1/ -2 /disk2/vid2/ -d /disk3/video1/ -f b8e1d57e3e2dbb40ac8f2b257b762d05fcfc5b79c32a22255424644b7d183daa7c454624783f2d959c02eb1d2a4ba3a3 -p 91ea997633345082b15f83b957449180037030b6b7485f07ed4ee7558d08d3efbccf2c3d68ba724f5b3a8281a0055e27
screen -dmS trans ./trans.sh
screen -dmS otchet python3 awsstat.py
screen -r trans
