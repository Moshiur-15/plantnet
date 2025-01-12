export const sortImgName = (image, length=10)=>{
    console.log(image)
    if(!image || typeof image?.name !== 'string')return 'Choose Image'
    if(image?.name.length <= 20) return image?.name;
    return image?.name.substring(0, length).concat(`...${image?.type.split('/')[1]}`)
}