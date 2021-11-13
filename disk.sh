#!/bin/bash
lsblk
echo -n Skolco ? : 
read skol
echo -n new_Disk : 
read disk 
if [ "$skol" = 1 ]; then sed -i "s|nvme1n1|$disk|g" "bash.bash" ; else  echo "Nemogu pomoch" ; fi

