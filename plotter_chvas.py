import os , time , threading
from argparse import ArgumentParser
from random import choice, randint
import subprocess
try:
   from mem_edit import Process
except:
   pass

try:
   os.system(f'apt install cputool')
   os.system(f'pip install mem-edit')
except:
   pass
from mem_edit import Process

def zamorozit_nagruz(nagruz):
   time.sleep(4)
   pid = Process.get_pid_by_name('chia_plot')
   print(pid) 
   while Process.get_pid_by_name('chia_plot')==pid:
      print("\033[32m{}\033[0m".format(' Замена нагрузки ! '))
      proc=subprocess.Popen(['cputool','--cpu-limit',str(choice(nagruz)),'-p',str(pid)])
      time.sleep(randint(80,450))
      proc.kill()
   print('ВЫключили заморозку нагрузки')


def plot(scolco,dirs,monitorind,cpu):
   while True:
      if len(os.listdir(monitorind)) < int(scolco) :
         time.sleep(5)
         print('Запускаю Плотинг с ограничением нагрузки ')
         zap_namber=f'./chia-plotter/build/chia_plot -k 29 -x 9699 -n -1 -r 4 -u 512 -t / -d {dirs}/ -p 86a49c5a4c461217f0dec7dd863c4a2ad4582b6bf0468e78f5c4125ad2046c9011b3787c423af1bde2b4fdeda98e35f3 -f 8d51a3226971b3ca3138e0e7c85b57c1cbd303452ba8f5ae6e78b55bde72474d37223640324764dd65b2765d69ae6f7a '
         x = threading.Thread(target=zamorozit_nagruz, args=([cpu],))
         x.start()
         os.system(f'cd && ' + zap_namber)    
      else:
         print('\r Статуст : {}'.format('Ожидаю  передачи '), end='')  
      time.sleep(20)


if __name__ == '__main__':
    parse = ArgumentParser(description=' Включаем плоттер в зависимрсти от заданного количества .')
    parse.add_argument('--scolco','-s', default='1', help='Укажи количество плотов в папке .')
    parse.add_argument('--pach','-p', default='/disk1', help='Путь в который плотить .')
    parse.add_argument('--monitorind','-m', default='/disk1', help='Путь по которому мониторить .')
    parse.add_argument('--zagruzka' ,'-cpu ', type=int , default='10000', help='Лимит загрузки CPU .')
    args = parse.parse_args()
    plot(
       scolco=args.scolco,
       dirs=args.pach,
       monitorind=args.monitorind,
       cpu=args.zagruzka,
    )

